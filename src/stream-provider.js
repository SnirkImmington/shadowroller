// @flow

import * as React from 'react';

import * as Event from 'history/event';
import * as Game from 'game';
import * as Player from 'player';
import * as server from 'server';
import { SetConnectionCtx } from 'connection';
import type { RetryConnection as RetryConn, SetConnection } from 'connection';

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

}

function handleUpdate(e: MessageEvent, eventDispatch: Event.Dispatch, gameDispatch: Game.Dispatch) {

}

function StreamProvider() {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx)

    const [source, setSource] = React.useState<?EventSource>(null);
    const [retryID, setRetryID] = React.useState<?TimeoutID>(null);

    const connect = React.useCallback(
        function connect(session: string, gameID: string, retries: number = 0) {
        setConnection("connecting");
        const source = new EventSource(
            `${server.BACKEND_URL}game/subscription?session=${session}`
        );
        source.onmessage = logMessage;
        source.addEventListener("event", (e: MessageEvent) =>
            handleEvent(e, eventDispatch));
        source.addEventListener("update", (e: MessageEvent) =>
            handleUpdate(e, eventDispatch, gameDispatch));
        source.onopen = function () {
            setRetryID(id => (clearTimeout(id), null));
            setConnection("connected");

            if (process.env.NODE_ENV !== "production") {
                // flow-ignore-all-next-line yes we can put that there thanks
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

            const timeoutDelay = retries > RETRY_DELAYS.length ?
                RETRY_MAX : RETRY_DELAYS[retries];
            const timeout = setTimeout(function() {
                connect(session, gameID, retries + 1);
            });
            setRetryID(timeout);
        }
        setSource(source);
    }, [gameDispatch, eventDispatch, setConnection, setSource, setRetryID]);

    return connect;
}
