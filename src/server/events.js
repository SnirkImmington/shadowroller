// @flow

import * as Event from 'event';

export function normalizeEvent(event: any) {
    if (!event.source) {
        event.source = { id: event.pID, name: event.pName };
        delete event.pID;
        delete event.pName;
    }
    if (event.roll && !event.dice) {
        event.dice = event.roll;
        delete event.roll;
    }
}

export function parseEvent(event: any): ?Event.Event {
    switch (event.ty) {
        case "roll":
            console.log("Parsing", event);
            return ({
                ty: "roll", id: event.id, edit: event.edit,
                source: {
                    id: event.pID, name: event.pName,
                },
                title: event.title ?? '',
                dice: event.dice,
            } : Event.Roll);
        case "edgeRoll":
            return {
                ty: "edgeRoll", id: event.id, edit: event.edit,
                source: {
                    id: event.pID, name: event.pName,
                },
                title: event.title ?? '',
                rounds: event.rounds,
            };
        case "rerollFailures":
            return {
                ty: "rerollFailures", id: event.id, edit: event.edit,
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
