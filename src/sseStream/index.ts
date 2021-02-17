import * as React from 'react';

import * as Event from 'history/event';
import * as Player from 'player';
import * as server from 'server';

// Delays for reconnecting the EventSource (in ms)
export const RETRY_DELAYS = [
    2, 2, 4, 4, 8, 8, 16, 16
].map(s => s * 1000);

export const RETRY_MAX = 32 * 1000;


export function logMessage(event: MessageEvent) {
    if (process.env.NODE_ENV !== "production" && event.data !== "") {
        console.log("Unexpected message", event);
    }
    // Otherwise, it's a ping
}

export function handleEvent(e: MessageEvent, eventDispatch: Event.Dispatch) {
    let eventData;
    try {
        // flow-ignore-all-next-line it's json parse
        eventData = JSON.parse(e.data);
    }
    catch (err) {
        console.error("Unparseable Event received from server:", err, e);
        return;
    }
    const event = server.parseEvent(eventData);
    if (!event) {
        console.error("Unable to parseEvent():", eventData, e);
        return;
    }
    eventDispatch({ ty: "newEvent", event });
}

export function handleEventUpdate(id: number, diff: any, edit: number, dispatch: Event.Dispatch) {
    if (diff === "del") {
        dispatch({ ty: "deleteEvent", id });
    }
    else if (diff["reroll"]) {
        dispatch({ ty: "reroll", id, edit, round: diff["reroll"] });
    }
    else {
        dispatch({ ty: "modifyRoll", id, edit, diff });
    }
}

export function handlePlayerUpdate(diff: Partial<Player.Player>, edit: number, dispatch: Player.Dispatch) {
    dispatch({ ty: "update", values: diff });
}

export function handleGameUpdate(ty: string, id: string, diff: any, edit: number, dispatch: Game.Dispatch) {
    dispatch({ ty: "playerUpdate", id, update: diff });
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

    if (typeof updateData !== "object" || updateData.length < 3) {
        console.error("Invalid update type from server:", updateData);
        return;
    }

    const [ty, id, diff, at] = updateData;

    switch (ty) {
        case "evt":
            handleEventUpdate(id, diff, at, eventDispatch);
            return;
        case "plr":
            if (id === playerID) {
                handlePlayerUpdate(diff, at, playerDispatch);
            }
            handleGameUpdate(ty, id, diff, at, gameDispatch);
            return;
        default:
            console.error("Unexpected event type", ty, "in", updateData);
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
