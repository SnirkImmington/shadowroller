import * as React from 'react';
import type { Setter } from 'srutil';
import type { Connection, SetConnection } from 'connection';

import * as Event from 'event';
import * as Game from 'game';
import * as Player from 'player';

export type State = WebSocket|null;
export const defaultState: State = null;

export const Ctx = React.createContext<State>(defaultState);
export const SetterCtx = React.createContext<Setter<State>>(() => {});

export const enum Opcode {
    Resume = "res",

    Player = "plr",
    Event = "evt",
    Game = "game",
    Initiative = "init"
}

/** Determines the Connection state for the WebSocket. */
export function connection(state: State): Connection {
    if (!state) {
        return "disconnected";
    }
    switch (state.readyState) {
        case state.CONNECTING:
            return "connecting";
        case state.OPEN:
            return "connected";
        case state.CLOSING:
            return "reconnecting";
        case state.CLOSED:
            return "reconnecting";
    }
}

/** Determines whether the socket is currently open. */
export function connected(state: State): boolean {
    return state && state.readyState === WebSocket.OPEN;
}

export type Args = {
    url: string,
    session: string,
    eventDispatch: Event.Dispatch,
    gameDispatch: Game.Dispatch,
    playerDispatch: Player.Dispatch,
    setConnection: SetConnection,
    setSocket: Setter<State>,
}

/**
   connect() uses the given dispatchers to open a WebSocket connection
 */
export function connect({ url, session, eventDispatch, gameDispatch, playerDispatch, setConnection, setSocket }): void {
    const socket = new WebSocket(`wss://${url}/`, ["sr-1.0.0"]);
    socket.addEventListener("open", function(e: Event) {
        switch (socket.readyState) {
            case socket.CONNECTING:
                setConnection("connecting");
                return;
            case socket.OPEN:
                setConnection("connected");
                return;
            case socket.CLOSED:
                setConnection("reconnecting");
                setSocket(null);
                connect(arguments);
                return;
        }
    });
    socket.addEventListener("message", function(event: Event) {
        let value;
        try {
            value = JSON.parse(event.data);
        }
        catch (e: Error) {
            if (process.env.NODE_ENV !== "production") {
                console.error("Cloud not parse event data", event.data);
            }
            return;
        }
        let [ty, id, diff] = value;
        switch (ty) {
            case "evt":
                handlers.event(id, diff, eventDispatch);
                return;
            case "plr":
                handlers.event(id, diff, eventDispatch);
                return;
            default:
                if (process.env.NODE_ENV !== "production") {
                    console.error("Received unknown event", value);
                }
        }
    });
    setSocket(socket);
}
