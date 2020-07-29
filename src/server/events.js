// @flow

import * as React from 'react';

import * as Event from 'event';
import * as server from '../server';
import type { Connection, SetConnection } from 'connection';

export function normalizeEvent(event: any) {
    if (!event.source) {
        event.source = { id: event.pID, name: event.pName };
        delete event.pID;
        delete event.pName;
    }
    if (event.roll && !event.dice) {
        event.dice = event.roll;
        event.roll = undefined;
    }
}

function parseEvent(event: any): ?Event.Event {
    switch (event.ty) {
        case "roll":
            return {
                ty: "roll", id: event.id,
                source: {
                    id: event.pID, name: event.pName,
                },
                title: event.title ?? '',
                dice: event.roll,
            };
        case "edgeRoll":
            return {
                ty: "edgeRoll", id: event.id,
                source: {
                    id: event.pID, name: event.pName,
                },
                title: event.title ?? '',
                rounds: event.rounds,
            };
        case "playerJoin":
            return {
                ty: "playerJoin", id: event.id,
                source: { id: event.pID, name: event.pName },
            };
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
        // flow-ignore-all-next-line
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
type EventsResponse = { events: Event.Event[], more: bool };
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
    session: ?string,
    setConnection: SetConnection,
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
            if (process.env.NODE_ENV !== "production") {
                console.log("Closing subscription!");
            }
            events.current.close();
        }

        if (!server.session || !gameID) {
            if (process.env.NODE_ENV !== "production") {
                // flow-ignore-all-next-line
                document.title = `Shadowroller (${process.env.NODE_ENV})`;
            }
            else {
                document.title = "Shadowroller";
            }
            events.current = null;
            return;
        }
        if (process.env.NODE_ENV !== "production") {
            console.log("Connecting to event stream:", gameID, server.session);
        }
        setConnection("connecting");
        const source = new EventSource(
            // flow-ignore-all-next-line
            `${server.BACKEND_URL}game/subscription?session=${server.session}`, {
            withCredentials: true,
        });
        source.onmessage = function(e) {
            onMessage(e, dispatch);
        };
        source.addEventListener("ping", function(event: mixed) { });
        source.onopen = function() {
            if (source.readyState === source.OPEN) {
                setConnection("connected");
                if (process.env.NODE_ENV !== "production") {
                    // flow-ignore-all-next-line
                    document.title = `${gameID} - Shadowroller (${process.env.NODE_ENV})`;
                }
                else {
                    document.title = gameID + " - Shadowroller";
                }
            }
            else {
                setConnection("connecting");
            }
        };
        source.onerror = function(e) {
            if (process.env.NODE_ENV !== "production") {
                console.error("EventStream error", e);
            }
            setConnection("errored");
        };
        events.current = source;
        return; // Cleanup handled imperatively through use of ref
        // and to account for program logic and EventSource specifics.
    }, [gameID, session, setConnection, dispatch]);

    return events.current;
}
