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
            ty: "gameRoll", id: event.id,
            playerID: event.pID, playerName: event.pName, dice: event.roll,
        });
    }
    else if (event.ty === "playerJoin") {
        dispatch({
            ty: "playerJoin", id: event.id,
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
    const events = React.useRef<?EventSource>();

    // This effect is only called when gameID changes.
    // It stores `events` in a ref for use imperatively between calls.
    // `events` is cleaned up only when `gameID` changes [i.e. to null].
    // We can leave the resource trying to reconnect otherwise.
    // When the gameID does change, we close the connection and re-create.
    React.useEffect(() => {
        if (events.current) {
            events.current.close();
        }

        if (!gameID) {
            events.current = null;
            return;
        }

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
        return; // Cleanup handled imperatively through use of ref.
    }, [gameID, setConnection, dispatch]);
}
