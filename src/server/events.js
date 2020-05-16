// @flow

import * as React from 'react';

import * as Event from 'event';
import * as server from 'server';

function onMessage(e, dispatch) {
    let event;
    try {
        event = JSON.parse(e.data);
    }
    catch (err) {
        console.error("Error parsing event", err, e);
        return;
    }
    if (event.ty === "roll") {
        const rollEvent: Event.GameRoll = {
            ty: "gameRoll", id: event.id,
            playerID: event.pID,
            playerName: event.pName,
            dice: event.roll,
            title: event.title ?? ''
        };
        dispatch({ ty: "newEvent", event: rollEvent });
    }
    else if (event.ty === "playerJoin") {
        const joinEvent: Event.PlayerJoin = {
            ty: "playerJoin", id: event.id,
            player: { id: event.pID, name: event.pName },
        }
        dispatch({ ty: "newEvent", event: joinEvent });
    }
    else {
        console.error("Received unknown event", event);
    }
}

export type LoadEventResult = Promise<{| events: Event.Event[], more: bool |}>
export function fetchEventsBefore(oldestID: string): LoadEventResult {
    const url = server.BACKEND_URL + 'event-range';
    const body = JSON.stringify({
        newer: oldestID,
    });
    return fetch(url, {
        credentials: 'include',
        method: 'get',
        body: body,
    }).then(response => response.json())
    .then(obj => {
        return (obj: {| events: Event.Event[], more: bool |});
    });
}

/*
- player-joined <- lastID // fetched[0]
- (older-1)
- (older-2)               // ...fetched[n]
*/
export function fetchInitialEvents(firstID: string, dispatch: Event.Dispatch): Promise<void> {
    dispatch({ ty: "setHistoryFetch", state: "fetching" });
    const body = JSON.stringify({
        newest: firstID
    });
    return fetch(server.BACKEND_URL + 'event-range', {
        method: 'get', body: body
    })
    .then(res => res.json())
    .then(({ events, more }) => {
        dispatch({ ty: "setHistoryFetch", state: more ? "ready" : "finished" });
        dispatch({ ty: "mergeEvents", events: events });
    });
}

export function useEvents(
        gameID: ?string,
        setConnection: server.SetConnection,
        dispatch: Event.Dispatch
): ?EventSource {
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
        return; // Cleanup handled imperatively through use of ref
        // and to account for program logic and EventSource specifics.
    }, [gameID, setConnection, dispatch]);

    return events.current;
}
