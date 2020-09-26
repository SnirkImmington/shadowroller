// @flow

import { get, post } from 'server';
import type { BackendRequest } from 'server/request';
import type { Event, DiceEvent } from 'event';

export type RenameRequest = {|
    name: string
|};

export function rename(request: RenameRequest): BackendRequest<void> {
    return post<RenameRequest, void>("game/rename", request);
}

export type ModifyRollRequest = {|
    id: number,
    diff: $Shape<DiceEvent>,
|};

export function modifyRoll(request: ModifyRollRequest): BackendRequest<void> {
    return post<ModifyRollRequest, void>("game/modify-roll", request);
}

export type DeleteEventRequest = {|
    id: number,
|};

export function deleteEvent(request: DeleteEventRequest): BackendRequest<void> {
    return post<DeleteEventRequest, void>("game/delete-roll", request);
}

export type RollRequest = {|
    count: number,
    title: string,
    edge: bool,
|};

export function roll(request: RollRequest): BackendRequest<void> {
    return post<RollRequest, void>("game/roll", request);
}

export type RerollRequest = {|
    rollID: number,
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
