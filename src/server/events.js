// @flow

import * as React from 'react';

import * as Event from 'event';
import * as routes from 'routes';
import * as server from '../server';
import type { SetConnection } from 'connection';

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

export function parseEvent(event: any): ?Event.Event {
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
        case "rerollFailures":
            return {
                ty: "rerollFailures", id: event.id,
                source: {
                    id: event.pID, name: event.pName,
                },
                rollID: event.rollID,
                title: event.title ?? "",
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

function onMessage(e: MessageEvent, dispatch) {
    console.log("Received message", e);
    if (e.data === "hi" || e.data === "") { return; }
    let eventData;
    try {
        // flow-ignore-all-next-line
        eventData = JSON.parse(e.data);
    }
    catch (err) {
        console.error("Invalid response from server:", err, e);
        return;
    }
    const event = parseEvent(eventData);
    if (!event) {
        console.error("Invalid event received from server", event);
        return;
    }
    dispatch({ ty: "newEvent", event });
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
        source.addEventListener("event", function(e: MessageEvent) {
            onMessage(e, dispatch);
        });
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
        source.onerror = function(event) {
            if (process.env.NODE_ENV !== "production") {
                console.error("EventStream error", event);
            }
            switch (event.target.readyState) {
                case source.OPEN:
                    setConnection("connected");
                    return;
                case source.CONNECTING:
                    setConnection("connecting");
                    return;
                case source.CLOSED:
                    setConnection("errored");
                    return;
                default:
                    if (process.env.NODE_ENV !== "production") {
                        console.log(
                            "Reached unknown event target error:", event
                        );
                    }
                    setConnection("errored");
                    return;
            }
        };
        events.current = source;
        return; // Cleanup handled imperatively through use of ref
        // and to account for program logic and EventSource specifics.
    }, [gameID, session, setConnection, dispatch]);

    return events.current;
}
