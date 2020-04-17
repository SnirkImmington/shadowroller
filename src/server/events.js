// @flow

import * as React from 'react';

import * as Event from 'event';
import * as server from 'server';

function onPing(e) {
}

function onMessage(e, dispatch) {
    console.log("Event received", e.data);
    let event;
    try {
        event = JSON.parse(e.data);
    }
    catch (err) {
        console.log("Error parsing event", err, e);
    }
    if (event.ty === "roll") {
        dispatch({
            ty: "gameRoll", id: event.id, ts: Date.now(),
            playerID: event.pID, dice: event.roll
        });
    }
    else if (event.ty === "playerJoin") {
        dispatch({
            ty: "playerJoin", id: event.id, ts: Date.now(),
            player: { id: event.pID, name: event.pName }
        });
    }
    else {
        console.log("Received unknown event", event);
    }
}

export function useEvents(
        gameID: ?string,
        setConnection: server.SetConnection,
        dispatch: Event.Dispatch
) {
    const [lastGameID, setLastGameID] = React.useState(null);
    const events = React.useRef<?EventSource>();

    React.useEffect(() => {
        if (gameID !== lastGameID) {
            if (events.current != null) {
                events.current.close();
            }
            setLastGameID(gameID);
            setConnection("offline");
        }
        if (!gameID) {
            events.current = null;
            return;
        }

        console.log("Creating eventsource for ", gameID);
        setConnection("connecting");
        const source = new EventSource(server.BACKEND_URL + "events", {
            withCredentials: true
        });
        source.onmessage = function(e) {
            onMessage(e, dispatch);
        };
        source.addEventListener("ping", function(event: mixed) {
            if (process.env.NODE_ENV !== "production") {
                console.log("Ping /events");
            }
        });
        source.onopen = function() {
            console.log("Connected to /events.");
            if (source.readyState === 1) {
                setConnection("connected");
            }
            else {
                setConnection("connecting");
            }
        };
        source.onerror = function(e) {
            console.error("Error reading /event!", e);
            setConnection("offline");
        };
        events.current = source;
        return () => {
            if (events.current) {
                events.current.close();
            }
            setConnection("offline");
        }
    }, [gameID, lastGameID, setConnection, dispatch]);
}
