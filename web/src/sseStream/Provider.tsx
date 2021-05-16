import * as React from 'react';

import * as Event from 'event';
import * as Game from 'game';
import * as Player from 'player';
import * as routes from 'routes';
import * as server from 'server';
import * as stream from '.';
import { SetConnectionCtx } from 'connection';
import type { BackendRequest } from 'server/request';

/** The EventSource for the server subscription */
let source: EventSource | null = null;
let retryID: NodeJS.Timeout | null = null;

/** cancel the retry if it is running. */
function clearRetryID(): void {
    if (retryID) {
        clearTimeout(retryID);
    }
    retryID = null;
}

/** close the eventsource if it is listening. */
function clearSource(): void {
    if (source) {
        if (process.env.NODE_ENV === "development") {
            console.log("Closed exising stream", source);
        }
        source.close();
    }
    source = null;
}


export default function Provider({ children }: React.PropsWithChildren<{}>) {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx)

    function connect({ session, gameID, playerID, retries }: stream.ConnectArgs) {
        retries = retries || 0;
        setConnection("connecting");
        clearSource();
        clearRetryID();

        let connectionSucessful = false;

        source = new EventSource(
            `${server.BACKEND_URL}game/subscription?session=${session}&retries=${retries}`
        );
        if (process.env.NODE_ENV === "development") {
            console.log("Opened event stream", source);
        }
        source.onopen = function () {
            setConnection("connected");

            connectionSucessful = true;

            if (process.env.NODE_ENV !== "production") {
                document.title = `${gameID} - Shadowroller (${process.env.NODE_ENV})`;
            }
            else {
                document.title = `${gameID} - Shadowroller`;
            }
        }

        stream.registerListeners({
            source, gameID, playerID,
            gameDispatch, playerDispatch, eventDispatch
        });

        source.onerror = function() {
            clearSource();
            setConnection("retrying");
            if (connectionSucessful) {
                retries = 0;
            }

            if (retries > stream.RETRY_DELAYS.length) {
                setConnection("disconnected");
            }

            const timeoutDelay = retries > stream.RETRY_DELAYS.length ?
                stream.RETRY_MAX : stream.RETRY_DELAYS[retries];
            const timeout = setTimeout(function() {
                connect({ session, gameID, playerID, retries: retries + 1 });
            }, timeoutDelay);
            retryID = timeout;
        }
    }
    const connectMemo = React.useCallback(connect,
        [connect, gameDispatch, eventDispatch, playerDispatch, setConnection]
    );

    const logout = React.useCallback(function logout(): BackendRequest<void> {
        setConnection("offline");
        clearSource();
        clearRetryID();
        gameDispatch({ ty: "leave" });
        eventDispatch({ ty: "clearEvents" });
        playerDispatch({ ty: "leave" });
        return routes.auth.logout();
    }, [gameDispatch, eventDispatch, playerDispatch]);

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
