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
                dice: event.dice,
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
