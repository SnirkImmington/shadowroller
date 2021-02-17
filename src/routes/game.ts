// @flow

import { get, post } from 'server';
import type { BackendRequest } from 'server/request';
import type { Event, DiceEvent } from 'history/event';

export type ModifyRollRequest = {
    id: number,
    diff: Partial<DiceEvent>,
};

export function modifyRoll(request: ModifyRollRequest): BackendRequest<void> {
    return post<ModifyRollRequest, void>("game/modify-roll", request);
}

export type DeleteEventRequest = {
    id: number,
};

export function deleteEvent(request: DeleteEventRequest): BackendRequest<void> {
    return post<DeleteEventRequest, void>("game/delete-roll", request);
}

export type RollRequest = {
    count: number,
    title: string,
    edge: boolean,
    glitchy: number,
};

export function roll(request: RollRequest): BackendRequest<void> {
    return post<RollRequest, void>("game/roll", request);
}

export type RollInitiativeRequest = {
    base: number,
    dice: number,
    title: string,
};
export function rollInitiative(request: RollInitiativeRequest): BackendRequest<void> {
    return post<RollInitiativeRequest, void>("game/roll-initiative", request);
}

export type RerollRequest = {
    rollID: number,
    rerollType: "rerollFailures"
};

export function reroll(request: RerollRequest): BackendRequest<void> {
    return post<RerollRequest, void>("game/reroll", request);
}

export type EventsRequest = {
    newest?: number,
    oldest?: number
};
export type EventsResponse = {
    events: Event[],
    lastID: number,
    more: boolean
};

export function getEvents(request: EventsRequest): BackendRequest<EventsResponse> {
    if (!request.oldest) {
        delete request.oldest;
    }
    if (!request.newest) {
        delete request.newest;
    }
    return get<EventsRequest, EventsResponse>("game/events", request);
}
