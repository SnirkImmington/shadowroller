// @flow

import * as React from 'react';
import * as Recoil from 'recoilRename';

import * as Events from 'event';
import * as server from 'server';
import type { Connection, SetConnection } from 'connection';

type StreamConnection = Connection | "reconnecting";

const streamState = Recoil.atom<?EventSource>({
    key: "stream.stream",
    default: null
});

const connectionState = Recoil.atom<StreamConnection>({
    key: "stream.connection",
    default: "offline"
});

type RetryState = { count: number, timer: ?TimeoutID }

const retriesState = Recoil.atom<RetryState>({
    key: "stream.retries",
    default: { count: 0, timer: null }
});

const isConnected = Recoil.selector<bool>({
    key: "stream.isConnected",
    get: ({get}) => {
        return get<Connection>(connectionState).ty === "connected";
    }
});

function openStream(url, get, set) {
    const source = new EventSource(url);
    set(streamState, source);
    set(connectionState, "connecting");
    source.onopen = function() { streamOnOpen(source, get, set); };
    source.onerror = function() { streamOnError(source, get, set); };
    return source;
}

function streamOnOpen(stream: EventSource, get, set) {
    // TODO game ID
    const gameID = "TODO Game ID";
    if (process.env.NODE_ENV !== "production") {
        document.title = `${gameID} - Shadowroller (${process.env.NODE_ENV})`;
    }
    else {
        document.title = `${gameID} - Shadowroller`;
    }
    const { timer } = get(retriesState);
    clearTimeout(timer);
    set(retriesState, { count: 0, timer: null }); // TOOD reset
    set(connectionState, "connected");
}

const REOPEN_DELAYS = [
    2, 2, 4, 4, 8, 8, 16, 16
].map(s => s * 1000);

const REOPEN_MAX = 32 * 1000;

function streamOnError(source: EventSource, get, set) {
    set(connectionState, "reconnecting");
    set(streamState, null);
    const { count } = get(retriesState);
    const delay = count > REOPEN_DELAYS.length ? REOPEN_MAX : REOPEN_DELAYS[count];
    const timer = setTimeout(
        function retry() {
            const url = source.url;
            const stream = openStream(url, get, set);
        },
        delay
    );
    set(retriesState, s => { count: s.count, timer });

}

function streamOnEvent({get, set}) {

}

const connect = Recoil.selector<string>({
    key: "stream.connect",
    set: ({get, set}, value: string) => {
        const connection = get<Connection>(connectionState);
        if (connection !== "offline") {
            return;
        }
        openStream(value, get, set);
    }
});

const disconnect = Recoil.selector<void>({
    key: "stream.disconnect",
    set: ({get, set}, _) => {
        set(connectionState, "offline");
        set(retriesState, { count: 0, timer: null }); // TODO reset
        const source = get<?EventSource>(streamState);
        if (source) {
            source.close();
            set(streamState, null);
        }
    }
});


function onMessage(event: MessageEvent) {
    if (process.env.NODE_ENV !== "production" && event.data !== "") {
        console.log("Unexpected message", event);
    }
}

function onEvent(streamEvent: MessageEvent, eventDispatch: Event.Dispatch) {
    let eventData;
    try {
        // flow-ignore-all-next-line
        eventData = JSON.parse(streamEvent.data);
    }
    catch (err) {
        console.error("Invalid Event received from server", err, streamEvent);
        return;
    }
    const event = server.parseEvent(eventData);
    if (!event) {
        console.error("Unable to parse event from server", eventData);
        return;
    }
    eventDispatch({ ty: "newEvent", event });
}

function onUpdate(event: MessageEvent, eventDispatch: Event.Dispatch) {
    if (process.env.NODE_ENV !== "production") {
        console.log("Received update", event.data, event);
    }
    let updateData: [number, $Shape<Event.DiceEvent>];
    try {
        // flow-ignore-all-next-line
        updateData = JSON.parse(event.data);
    }
    catch (err) {
        console.error("Invalid update received from server", err, event);
        return;
    }
    if (typeof updateData !== "object" || updateData.length !== 3) {
        console.error("Invalid update type received from server", event);
        return;
    }
    const [id, edit, diff] = updateData;

    if (diff === "del") {
        eventDispatch({ ty: "deleteEvent", id });
    }
    else if (diff["reroll"]) {
        eventDispatch({ ty: "reroll", id, edit, round: diff["reroll"] });
    }
    else {
        eventDispatch({ ty: "modifyRoll", id, edit, diff });
    }
}

export function open(
    gameID: string, session: string,
    setConnection: SetConnection,
    eventDispatch: Event.Dispatch,
): EventSource {
    if (process.env.NODE_ENV !== "production") {
        console.log("Connecting to", gameID, "via session", session);
    }
    const source = new EventSource(
        `${server.BACKEND_URL}game/subscription?session=${session}`,
        { withCredentials: true, }
    );
    source.onmessage = onMessage;
    source.addEventListener("event", (e: MessageEvent) => onEvent(e, eventDispatch));
    source.addEventListener("update", (e: MessageEvent) => onUpdate(e, eventDispatch));
    source.onopen = function() {
        if (process.env.NODE_ENV !== "production") {
            // flow-ignore-all-next-line
            document.title = `${gameID} - Shadowroller (${process.env.NODE_ENV})`;
        }
        else {
            document.title = `${gameID} - Shadowroller`;
        }
        setConnection("connected");
    }
    source.onerror = function(event) {
        if (process.env.NODE_ENV !== "production") {
            console.error("EventSource error:", event);
        }
        setConnection("errored");
    }

    setConnection("connecting");
    return source;
}
