// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
// import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import * as Event from 'event';

import * as server from 'server';
import * as srutil from 'srutil';

const ENTER_GAME_ID_FLAVOR = [
    "I hope you've got a good fake.",
    "No, 'password12345' is not a game ID.",
    "ID please.",
    "Show some ID, chummer.",

    "Pull out your best SIN.",
    "You'll need at least an R4 SIN.",
    "Roll Forgery.",
];
const LOADING_FLAVOR = [
    "Hacking you in",
    "Acquiring marks",
];

const MenuLayout = styled(UI.ColumnToRow)`
    padding: 0px 0.5em;
    @media all and (min-width: 768px) {
        padding: 0px 1em;
        align-items: center;
    }
`;

const ButtonZone = styled(UI.FlexRow)`
    /* Mobile: last row, button on the right */
    justify-content: flex-end;

    margin-top: .5em;
    @media all and (min-width: 768px) {
        margin-top: 0px;
    }
`;

type Props = {
    +connection: server.Connection,
    +setConnection: server.SetConnection,
    +hide: () => void,
    +dispatch: Game.Dispatch,
    +eventDispatch: Event.Dispatch,
};
export function JoinMenu({ connection, setConnection, hide, dispatch, eventDispatch }: Props) {
    const [gameID, setGameID] = React.useState('');
    const [playerName, setPlayerName] = React.useState('');
    const enterIDFlavor = srutil.useFlavor(ENTER_GAME_ID_FLAVOR);
    const loadingFlavor = srutil.useFlavor(LOADING_FLAVOR);

    const ready = gameID !== '' && playerName !== '';

    function onGameIDChange(event: SyntheticInputEvent<HTMLInputElement>) {
        setGameID(event.target.value ?? '');
    }
    function onPlayerNameChange(event: SyntheticInputEvent<HTMLInputElement>) {
        setPlayerName(event.target.value ?? '');
    }

    function onSubmit(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        if (!ready) { return; }

        server.requestJoin(gameID, playerName)
            .then(resp => {
                dispatch({
                    ty: "join",
                    gameID: gameID,
                    player: { id: resp.playerID, name: playerName },
                    players: resp.players
                });
                setConnection("connected");
                hide();
                eventDispatch({ ty: "setHistoryFetch", state: "fetching" });
                server.fetchEvents({ oldest: resp.newestID }).then(resp => {
                    eventDispatch({
                        ty: "setHistoryFetch", state: resp.more ? "ready" : "finished"
                    });
                    eventDispatch({ ty: "mergeEvents", events: resp.events });
                })
            })
            .catch((err: mixed) => {
                if (process.env.NODE_ENV !== "production") {
                    console.log("Error connecting", err);
                }
                setConnection("offline");
            });
        setConnection("connecting");
    }

    let flavor = connection === "connecting" ? loadingFlavor : enterIDFlavor;

    return (
        <UI.Menu color="dimGray">
            <form id="join-game-menu">
                <MenuLayout>
                    <span style={{marginRight: 'auto'}}>
                        Join a game if you've been given a Game ID.
                    </span>
                    <UI.FlexRow>
                        <UI.Input monospace id="join-game-id"
                                  placeholder={"Game ID"}
                                  value={gameID} onChange={onGameIDChange}
                                  disabled={connection === "connecting"} />
                        <UI.Input id="join-player-name"
                                  placeholder={"Player name"}
                                  value={playerName} onChange={onPlayerNameChange}
                                  disabled={connection === "connecting"} />

                    </UI.FlexRow>
                    <ButtonZone>
                        <UI.Flavor>{flavor}</UI.Flavor>
                        <UI.Button id="join-game-submit" onClick={onSubmit}
                                   disabled={!ready}>
                            Join
                        </UI.Button>
                    </ButtonZone>
                </MenuLayout>
            </form>
        </UI.Menu>
    )
}
