import * as React from 'react';

import * as Event from 'event';
import * as Game from 'game';
import * as Player from 'player';
import * as server from 'server';

/** Delays for reconnecting the EventSource (in ms) */
export const RETRY_DELAYS = [
    2, 2, 4, 4, 8, 8, 16, 16
].map(s => s * 1000);

/** Max amount of time between retries */
export const RETRY_MAX = 32 * 1000;

type RegisterListenersArgs = {
    source: EventSource,
    gameID: string,
    playerID: string,

    eventDispatch: Event.Dispatch,
    gameDispatch: Game.Dispatch,
    playerDispatch: Player.Dispatch,
}
export function registerListeners({ source, gameID, playerID, eventDispatch, gameDispatch, playerDispatch }: RegisterListenersArgs) {
    source.addEventListener("upd", e => handleUpdate(e as MessageEvent, playerID, eventDispatch, gameDispatch, playerDispatch));
    source.onmessage = logMessage;
}


function logMessage(event: MessageEvent) {
    if (process.env.NODE_ENV !== "production" && event.data !== "") {
        console.log("Unexpected message", event);
    }
    // Otherwise, it's a ping
}

export function handleUpdate(e: MessageEvent, playerID: string, eventDispatch: Event.Dispatch, gameDispatch: Game.Dispatch, playerDispatch: Player.Dispatch) {
    let updateData: any[];
    try {
        // flow-ignore-all-next-line it's json parse
        updateData = JSON.parse(e.data);
    }
    catch (err) {
        console.error("Unparseable Update received from server:", err, e);
        return;
    }

    if (typeof updateData !== "object" || updateData.length < 2) {
        console.error("Invalid update type from server:", updateData);
        return;
    }

    const ty = updateData[0];
    updateData = updateData.slice(1);

    if (process.env.NODE_ENV === "development") {
        console.log("SSE: update", ty, ...updateData);
    }

    switch (ty) {
        case "+evt":
            const [newEvent] = updateData as [Event.Event];
            const parsedNewEvent = server.parseEvent(newEvent);
            if (!parsedNewEvent) {
                if (process.env.NODE_ENV === "development") {
                    console.error("Unable to parse new event", updateData);
                }
                return;
            }
            eventDispatch({ ty: "newEvent", event: parsedNewEvent });
            return;
        case "-evt":
            const [delEventID] = updateData as [number];
            eventDispatch({ ty: "deleteEvent", id: delEventID });
            return;
        case "~evt":
            const [modEventID, eventDiff, eventEdit] = updateData as [number, Partial<Event.Event>, number];
            eventDispatch({ ty: "modifyEvent", id: modEventID, edit: eventEdit, diff: eventDiff });
            return;
        case "^roll":
            const [rerollEventID, { reroll }, rerollEdit] = updateData as [number, {reroll: number[]}, number];
            eventDispatch({ ty: "reroll", id: rerollEventID, edit: rerollEdit, reroll });
            return;

        case "+plr":
            const [newPlayer] = updateData as [Player.Info];
            gameDispatch({ ty: "newPlayer", player: newPlayer });
            return;
        case "-plr":
            const [delPlayerID] = updateData as [string];
            gameDispatch({ ty: "deletePlayer", id: delPlayerID });
            return;
        case "~plr":
            const [modPlayerID, playerDiff] = updateData as [string, Partial<Player.Info>];
            if (modPlayerID === playerID) {
                playerDispatch({ ty: "update", diff: playerDiff });
            }
            gameDispatch({ ty: "updatePlayer", id: modPlayerID, diff: playerDiff });
            return;
    }
}

export type ConnectArgs = {
    session: string,
    gameID: string,
    playerID: string,
    retries: number
};
export type ConnectFn = (args: ConnectArgs) => void;
export type LogoutFn = () => server.BackendRequest<void> | void;

export const Ctx = React.createContext<[ConnectFn, LogoutFn]>([() => {}, (() => {})]);
