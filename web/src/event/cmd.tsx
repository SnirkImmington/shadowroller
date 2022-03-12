import * as React from 'react';
import * as Event from 'event';
import * as Game from 'game';
import * as Share from 'share';

import * as roll from 'roll';
import * as routes from 'routes';
import * as srutil from 'srutil';

export type Command =
| { ty: "roll", title: string, pool: number, pushed: boolean, glitchy: number, share?: Share.Mode }
| { ty: "rollInitiative", title: string, base: number, dice: number, seized: boolean, blitzed: boolean, share?: Share.Mode }

// handleLocalCommand runs the command for the local state.
function handleLocalCommand(cmd: Command, eventDispatch: Event.Dispatch) {
    switch (cmd.ty) {
        case "roll":
            let rollEvent: Event.DiceEvent;
            if (cmd.pushed) {
                const rounds = roll.explodingSixes(cmd.pool);
                rollEvent = {
                    ty: "edgeRoll", source: "local", id: Event.newID(),
                    title: cmd.title, rounds, glitchy: cmd.glitchy,
                };
            } else {
                const dice = roll.dice(cmd.pool);
                rollEvent = {
                    ty: "roll", source: "local", id: Event.newID(),
                    title: cmd.title, dice, glitchy: cmd.glitchy,
                };
            }
            eventDispatch({ ty: "newEvent", event: rollEvent });
            return;
        case "rollInitiative":
            const dice = roll.dice(cmd.blitzed ? 5 : cmd.dice);
            const initEvent: Event.Initiative = {
                ty: "initiativeRoll", source: "local", id: Event.newID(),
                title: cmd.title, base: cmd.base, dice, seized: cmd.seized, blitzed: cmd.blitzed,
            };
            eventDispatch({ ty: "newEvent", event: initEvent });
            return;
        default:
            if (process.env.NODE_ENV !== "production") {
                console.error("Unexpected event command", cmd);
            }
    }
}

function handleGameCommand(cmd: Command, setLoading?: srutil.Setter<boolean>) {
    switch (cmd.ty) {
        case "roll":
            routes.game.roll({
                title: cmd.title, share: cmd.share ?? Share.Mode.InGame,
                count: cmd.pool, edge: cmd.pushed, glitchy: cmd.glitchy,
            }).onDone((res, full) => {
                if (!res && process.env.NODE_ENV !== "production") {
                    console.error("Error rolling dice:", full);
                }
            }).onLoading(setLoading);
            return;
        case "rollInitiative":
            const dice = cmd.blitzed ? 5 : cmd.dice;
            routes.game.rollInitiative({
                title: cmd.title, share: cmd.share ?? Share.Mode.InGame,
                base: cmd.base, dice, blitzed: cmd.blitzed, seized: cmd.seized,
            }).onDone((res, full) => {
                if (!res && process.env.NODE_ENV !== "production") {
                    console.error("Error rolling initiative:", full);
                }
            }).onLoading(setLoading);
            return;
        default:
            if (process.env.NODE_ENV !== "production") {
                console.error("game cmd handler got invalid command:", cmd);
            }
    }
}

type CmdDispatch = (cmd: Command, setLoading?: srutil.Setter<boolean>) => void;

/** CmdCtx contains a dispatcher for commands. */
export const CmdCtx = React.createContext<CmdDispatch>(() => {});

export function CmdProvider({ children }: React.PropsWithChildren<never>) {
    const game = React.useContext(Game.Ctx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const gameFound = Boolean(game);

    const cmdDispatch = React.useCallback((cmd: Command, setLoading?: srutil.Setter<boolean>) => {
        if (gameFound) {
            handleGameCommand(cmd, setLoading);
        } else {
            handleLocalCommand(cmd, eventDispatch);
        }
    }, [gameFound, eventDispatch]);

    return (
        <CmdCtx.Provider value={cmdDispatch}>
            {children}
        </CmdCtx.Provider>
    );
}
