import * as React from 'react';

import * as Event from 'history/event';
import * as Game from 'game';
import * as Player from 'player';
import { SetConnectionCtx } from 'connection';

function clearRetryID(id: NodeJS.Timeout | null): NodeJS.Timeout | null {
    clearTimeout(id!);
    return null;
}

function clearSocket(source: WebSocket | null): WebSocket | null {
    if (source) {
        source.close(1001, "Socket clear");
    }
    return null;
}

/** API protocol code for frontend */
const SR_PROTOCOL = "sr-1.0.0";

function connect({ session, eventDispatch, gameDispatch, playerDispatch, setConnection }) {
    const socket = new WebSocket(`wss://localhost:3001/game/socket?session=${session}`, [SR_PROTOCOL]);
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
                return;
        }
    });
    socket.addEventListener("message", function(event: MessageEvent) {
        let value;
        try {
            value = json.parse(event.data);
        }
        catch e {
            if (process.env.NODE_ENV !== "production") {
                console.error("Cloud not parse event data", event.data);
            }
            return;
        }
        let [ty, id, diff] = value;
        switch (ty) {
            case "ev":
                eventDispatch(message);
                return;
            case "plr":
                eventDispatch(message);
                return;
            default:
                if (process.env.NODE_ENV !== "production") {
                    console.error("Received unknown event type", message);
                }
        }
    });
    return socket;
}

export default function Provider() {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const gameDispatch = React.useContext(Game.Dispatch);
    const playerDispatch = React.useContext(Player.Dispatch);
    const setConnection = React.useContext(SetConnectionCtx);

    const [, setSocket] = React.useState<WebSocket|null>(null);
    const [, setRetryID] = React.useState<NodeJS.Timeout|null>(null);

    const connect = React.useCallback(function connect({ session, gameID, playerID, retries }: stream.ConnectArgs) {
        retries = retries || 0;
        setConnection("connecting");
        setSource(clearSource);
        setRetryID(clearRetryID);
        let sucessful = false;

        const socket = new WebSocket(`wss://${server.BACKEND_URL.slice(8)}game/subscription?session=${session}&retries=${retries}`);

    }, [setConnection, setSocket, setRetryID])
}
