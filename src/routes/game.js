// @flow

import { get, post } from 'server';
import type { GameInfo } from 'routes';
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

export type EventsRequest = {|
    newest?: string,
    oldest?: string
|};
export type EventsResponse = {|
    events: Event[],
    lastID: string,
    more: bool
|};

export function getEvents(request: EventsRequest): BackendRequest<EventsResponse> {
    return get<EventsRequest, EventsResponse>("game/events", request);
}