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
    if (event.glitchy == null) {
        event.glitchy = 0;
    }
}

export function parseEvent(event: any): ?Event.Event {
    switch (event.ty) {
        case "roll":
            return ({
                ty: "roll", id: event.id, edit: event.edit,
                source: {
                    id: event.pID, name: event.pName,
                },
                title: event.title ?? '',
                dice: event.dice,
                glitchy: event.glitchy ?? 0,
            } : Event.Roll);
        case "edgeRoll":
            return {
                ty: "edgeRoll", id: event.id, edit: event.edit,
                source: {
                    id: event.pID, name: event.pName,
                },
                title: event.title ?? '',
                rounds: event.rounds,
                glitchy: event.glitchy ?? 0,
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
                glitchy: event.glitchy ?? 0,
            };
        case "initiativeRoll":
            return {
                ty: "initiativeRoll", id: event.id, edit: event.edit,
                source: {
                    id: event.pID, name: event.pName,
                },
                title: event.title ?? "",
                base: event.base, dice: event.dice,
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
