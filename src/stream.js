// @flow

import * as React from 'react';

import * as Event from 'event';
import * as server from 'server';
import type { SetConnection } from 'connection';

export type State = ?EventSource;
export type Setter = (State) => void;

export const Ctx = React.createContext<State>(null);
export const SetterCtx = React.createContext<Setter>(() => {});

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
    if (typeof updateData !== "object" || updateData.length != 2) {
        console.error("Invalid update type received from server", event);
    }
    const [id, diff] = updateData;

    if (diff === "del") {
        eventDispatch({ ty: "deleteEvent", id });
    }
    else {
        eventDispatch({ ty: "modifyRoll", id, diff });
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
