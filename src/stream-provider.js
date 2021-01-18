// @flow

import * as React from 'react';

import * as Event from 'history/event';
import * as Game from 'game';
import * as Player from 'player';
import routes from 'routes';
import * as server from 'server';
import { SetConnectionCtx } from 'connection';
import type { BackendRequest } from 'server/request';

// Delays for reconnecting the EventSource (in ms)
const RETRY_DELAYS = [
    2, 2, 4, 4, 8, 8, 16, 16
].map(s => s * 1000);

const RETRY_MAX = 32 * 1000;


function logMessage(event: MessageEvent) {
    if (process.env.NODE_ENV !== "production" && event.data !== "") {
        console.log("Unexpected message", event);
    }
    // Otherwise, it's a ping
}

function handleEvent(e: MessageEvent, eventDispatch: Event.Dispatch) {
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

function handleEventUpdate(id: number, diff: any, edit: number, dispatch: Event.Dispatch) {
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

function handlePlayerUpdate(diff: $Shape<Player.Player>, edit: number, dispatch: Player.Dispatch) {
    dispatch({ ty: "update", values: diff });
}

function handleGameUpdate(ty: string, id: string, diff: any, edit: number, dispatch: Game.Dispatch) {
    dispatch({ ty: "playerUpdate", id, update: diff });
}

function handleUpdate(e: MessageEvent, playerID: string, eventDispatch: Event.Dispatch, gameDispatch: Game.Dispatch, playerDispatch: Player.Dispatch) {
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

type ConnectArgs = {| +session: string, +gameID: string, +playerID: string, +retries: number |};
export type ConnectFn = (ConnectArgs) => void;
export type LogoutFn = () => ?BackendRequest<void>;

export const Ctx = React.createContext<[ConnectFn, LogoutFn]>([() => {}, () => {}]);

export function Provider(props: { children: React.Node }) {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx)

    // The actual values from these are not used: we don't handle the eventstream
    // directly and we only use the retryID via the updater form of setRetryID.
    const [source, setSource] = React.useState<?EventSource>(null); // eslint-disable-line no-unused-vars
    const [retryID, setRetryID] = React.useState<?TimeoutID>(null); // eslint-disable-line no-unused-vars

    function connect({ session, gameID, playerID, retries }: ConnectArgs) {
        retries = retries || 0;
        setConnection("connecting");
        setSource(s => { s && s.close(); return null; });
        setRetryID(id => { clearTimeout(id); return null; });

        let connectionSucessful = false;

        const source = new EventSource(
            `${server.BACKEND_URL}game/subscription?session=${session}&retries=${retries}`
        );
        source.onmessage = logMessage;
        source.addEventListener("event", (e: MessageEvent) =>
            handleEvent(e, eventDispatch));
        source.addEventListener("update", (e: MessageEvent) =>
            handleUpdate(e, playerID, eventDispatch, gameDispatch, playerDispatch));
        source.onopen = function () {
            setConnection("connected");
            setRetryID(id => { clearTimeout(id); return null; });
            connectionSucessful = true;

            if (process.env.NODE_ENV !== "production") {
                // flow-ignore-all-next-line yes we can put that there thanks
                document.title = `${gameID} - Shadowroller (${process.env.NODE_ENV})`;
            }
            else {
                document.title = `${gameID} - Shadowroller`;
            }
        }
        source.onerror = function(e) {
            console.log("Source error", source, e, "retry #", retries);
            source.close();
            setSource(null);
            setConnection("retrying");
            if (connectionSucessful) {
                retries = 0;
            }

            const timeoutDelay = retries > RETRY_DELAYS.length ?
                RETRY_MAX : RETRY_DELAYS[retries];
            const timeout = setTimeout(function() {
                connect({ session, gameID, playerID, retries: retries + 1 });
            }, timeoutDelay);
            setRetryID(timeout);
        }
        setSource(source);
    }
    const connectMemo = React.useCallback(connect,
        [connect, gameDispatch, eventDispatch, playerDispatch, setConnection, setSource, setRetryID]);

    const logout = React.useCallback(function logout(): BackendRequest<void> {
        setConnection("offline");
        setSource(s => { s && s.close(); return null; });
        gameDispatch({ ty: "leave" });
        eventDispatch({ ty: "clearEvents" });
        playerDispatch({ ty: "leave" });
        return routes.auth.logout();
    }, [gameDispatch, eventDispatch, playerDispatch, setConnection, setSource]);

    // Memoize making a new array every time?
    const value = React.useMemo(() => [connectMemo, logout], [connectMemo, logout]);

    return (
        <Ctx.Provider value={value}>
            {props.children}
        </Ctx.Provider>
    );
}
