// @flow

import { get, post } from 'server';
import type { BackendRequest } from 'server/request';
import type { Event } from 'event';

export type RollRequest = {|
    count: number,
    title: string,
    edge: bool,
|};

export function roll(request: RollRequest): BackendRequest<void> {
    return post<RollRequest, void>("game/roll", request);
}

export type RerollRequest = {|
    rollID: string,
    rerollType: "rerollFailures"
|};

export function reroll(request: RerollRequest): BackendRequest<void> {
    return post<RerollRequest, void>("game/reroll", request);
}

export type EventsRequest = {|
    newest?: number,
    oldest?: number
|};
export type EventsResponse = {|
    events: Event[],
    lastID: number,
    more: bool
|};

export function getEvents(request: EventsRequest): BackendRequest<EventsResponse> {
    return get<EventsRequest, EventsResponse>("game/events", request);
}
