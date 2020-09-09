// @flow

import * as React from 'react';

import * as Game from 'game';
import * as Event from 'event';
import * as server from 'server';
import type { Connection, SetConnection } from 'connection';

export type State = ?EventSource;
export type Setter = (State) => void;

export const Ctx = React.createContext<State>(null);
export const SetterCtx = React.createContext<Setter>(() => {});

function onMessage(event: MessageEvent) {
    if (process.env.NODE_ENV !== "production" && event.data !== "") {
        console.log("Unexpected message", event);
    }
}

function onEvent(event: MessageEvent) {
    console.log("EventSource Event", event);
}

function onUpdate(event: MessageEvent) {
    console.log("EventSource Update", event);
}

export function open(gameID: string, session: string, setConnection: SetConnection): EventSource {
    if (process.env.NODE_ENV !== "production") {
        console.log("Connecting to", gameID, "via session", session);
    }
    const source = new EventSource(
        `${server.BACKEND_URL}game/subscription?session=${session}`,
        { withCredentials: true, }
    );
    source.onmessage = onMessage;
    source.addEventListener("event", onEvent);
    source.addEventListener("update", onUpdate);
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

export function SubscriptionHolder(props: { children: React.Node }) {
    const game = React.useContext(Game.Ctx);
    const eventDispatch = React.useContext(Event.DispatchCtx);

    const [stream, setStream] = React.useState<?EventSource>(null);

    return (
        <Ctx.Provider value={stream}>
        <SetterCtx.Provider value={setStream}>
            {props.children}
        </SetterCtx.Provider>
        </Ctx.Provider>
    );
}
