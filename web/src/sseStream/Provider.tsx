import * as React from 'react';

import * as Event from 'event';
import * as Game from 'game';
import * as Player from 'player';
import * as routes from 'routes';
import * as server from 'server';
import * as stream from '.';
import { SetConnectionCtx } from 'connection';
import type { BackendRequest } from 'server/request';

function clearRetryID(id: NodeJS.Timeout|null): NodeJS.Timeout|null {
    clearTimeout(id!);
    return null;
}

function clearSource(source: EventSource|null): EventSource|null {
    if (source) {
        source.close();
    }
    return null;
}

export default function Provider({ children }: React.PropsWithChildren<{}>) {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx)

    // The actual values from these are not used: we don't handle the eventstream
    // directly and we only use the retryID via the updater form of setRetryID.
    const [, setSource] = React.useState<EventSource|null>(null);
    const [, setRetryID] = React.useState<NodeJS.Timeout|null>(null);

    function connect({ session, gameID, playerID, retries }: stream.ConnectArgs) {
        retries = retries || 0;
        setConnection("connecting");
        setSource(clearSource);
        setRetryID(clearRetryID);

        let connectionSucessful = false;

        const source = new EventSource(
            `${server.BACKEND_URL}game/subscription?session=${session}&retries=${retries}`
        );
        source.onmessage = stream.logMessage;
        source.addEventListener("event", (e: Event) =>
            stream.handleEvent(e as MessageEvent, eventDispatch));
        source.addEventListener("update", (e: Event) =>
            stream.handleUpdate(e as MessageEvent, playerID, eventDispatch, gameDispatch, playerDispatch));
        source.onopen = function () {
            setConnection("connected");
            setRetryID(id => { clearTimeout(id!); return null; });
            connectionSucessful = true;

            if (process.env.NODE_ENV !== "production") {
                document.title = `${gameID} - Shadowroller (${process.env.NODE_ENV})`;
            }
            else {
                document.title = `${gameID} - Shadowroller`;
            }
        }
        source.onerror = function() {
            source.close();
            setSource(null);
            setConnection("retrying");
            if (connectionSucessful) {
                retries = 0;
            }

            if (retries > stream.RETRY_DELAYS.length) {
            }

            const timeoutDelay = retries > stream.RETRY_DELAYS.length ?
                stream.RETRY_MAX : stream.RETRY_DELAYS[retries];
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
        setSource(clearSource);
        setRetryID(clearRetryID);
        gameDispatch({ ty: "leave" });
        eventDispatch({ ty: "clearEvents" });
        playerDispatch({ ty: "leave" });
        return routes.auth.logout();
    }, [gameDispatch, eventDispatch, playerDispatch, setConnection, setSource]);

    // Prevent a new array being passed to the context provider
    const value: [stream.ConnectFn, stream.LogoutFn] = React.useMemo(() =>
        [connectMemo, logout],
    [connectMemo, logout]);

    return (
        <stream.Ctx.Provider value={value}>
            {children}
        </stream.Ctx.Provider>
    );
}
