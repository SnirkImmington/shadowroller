import * as Event from 'history/event';
import * as Share from 'share';

export function normalizeEvent(event: any) {
    if (!event.source) {
        event.source = {
            id: event.pID,
            name: event.pName,
            share: event.share ?? Share.InGame
        };
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

export function parseEvent(event: any): Event.Event | null {
    switch (event.ty) {
        case "roll":
            let rollResult: Event.Roll = {
                ty: "roll", id: event.id, edit: event.edit,
                source: {
                    id: event.pID,
                    name: event.pName,
                    share: event.share ?? Share.InGame
                },
                title: event.title ?? '',
                dice: event.dice,
                glitchy: event.glitchy ?? 0,
            };
            return rollResult;
        case "edgeRoll":
            return {
                ty: "edgeRoll", id: event.id, edit: event.edit,
                source: {
                    id: event.pID,
                    name: event.pName,
                    share: event.share ?? Share.InGame
                },
                title: event.title ?? '',
                rounds: event.rounds,
                glitchy: event.glitchy ?? 0,
            };
        case "rerollFailures":
            return {
                ty: "rerollFailures", id: event.id, edit: event.edit,
                source: {
                    id: event.pID,
                    name: event.pName,
                    share: event.share ?? Share.InGame
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
                    id: event.pID,
                    name: event.pName,
                    share: event.share ?? Share.InGame,
                },
                title: event.title ?? "",
                base: event.base, dice: event.dice,
                seized: event.seized ?? false,
                blitzed: event.blitzed ?? false,
            };
        case "playerJoin":
            return {
                ty: "playerJoin", id: event.id,
                source: { id: event.pID, name: event.pName, share: Share.InGame },
            };
        default:
            if (process.env.NODE_ENV !== 'production') {
                console.error("Invalid event", event);
            }
            return null;
    }
}
