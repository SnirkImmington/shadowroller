// @flow

import { get, post } from 'server';
import type { BackendRequest } from 'server/request';
import type { Event } from 'event';

export type RenameRequest = {|
    name: string
|};

export function rename(request: RenameRequest): BackendRequest<void> {
    // flow-ignore-all-next-line
    return post<RenameRequest, void>("game/rename", request);
}

export type RollRequest = {|
    count: number,
    title: string,
    edge: bool,
|};

export function roll(request: RollRequest): BackendRequest<void> {
    // flow-ignore-all-next-line
    return post<RollRequest, void>("game/roll", request);
}

export type RerollRequest = {|
    rollID: number,
    rerollType: "rerollFailures"
|};

export function reroll(request: RerollRequest): BackendRequest<void> {
    // flow-ignore-all-next-line
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
    // flow-ignore-all-next-line
    return get<EventsRequest, EventsResponse>("game/events", request);
}
