// @flow

import * as React from 'react';

import * as Event from 'event';
import * as server from '../server';

function parseEvent(event: any): ?Event.ServerEvent {
    switch (event.ty) {
        case "roll":
            return ({
                ty: "gameRoll", id: event.id,
                playerID: event.pID,
                playerName: event.pName,
                dice: event.roll,
                title: event.title ?? ''
            }: Event.GameRoll);
        case "playerJoin":
            return ({
                ty: "playerJoin", id: event.id,
                player: { id: event.pID, name: event.pName },
            }: Event.PlayerJoin);
        default:
            if (process.env.NODE_ENV !== 'production') {
                console.error("Invalid event", event);
            }
            return null;
    }
}

function onMessage(e, dispatch) {
    let eventData;
    try {
        eventData = JSON.parse(e.data);
    }
    catch (err) {
        console.error("Invalid response from server", err, e);
        return;
    }
    const event = parseEvent(eventData);
    if (!event) {
        console.error("Invalid event received from server", event);
        return;
    }
    dispatch({ ty: "newEvent", event });
}

/*
- player-joined <- lastID // fetched[0]
- (older-1)
- (older-2)               // ...fetched[n]
*/
type EventsParams = { oldest?: string, newest?: string };
type EventsResponse = { events: Event.ServerEvent[], more: bool };
export function fetchEvents(params: EventsParams): Promise<EventsResponse> {
    return server.backendPost("event-range", params).then(resp => {
        const events = [];
        for (const eventData of resp.events) {
            const event = parseEvent(eventData);
            if (!event) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error("Could not parse event", eventData);
                }
                continue;
            }
            events.push(event);
        }
        return { events, more: resp.more };
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
