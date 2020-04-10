// @flow

import * as React from 'react';

import type { Player } from 'game/state';

export type EventInfo = {|
    +id: number,
    +ts: number
|};

export type LocalRollEvent = {|
    +ty: "localRoll",
    +dice: number[],
|};

export type GameRollEvent = {|
    +ty: "gameRoll",
    +playerID: string,
    +playerName: string,
    +dice: number[],
    ...EventInfo
|};

export type GameJoinEvent = {|
    +ty: "gameJoin",
    +gameID: string,
|};

export type GameConnectEvent = {|
    +ty: "gameConnect",
    +connected: bool,
    ...EventInfo
|};

export type PlayerJoinEvent = {|
    +ty: "playerJoin",
    +player: Player,
    ...EventInfo
|};

export type GameEvent =
| LocalRollEvent
| GameJoinEvent
| GameRollEvent
| GameConnectEvent
| PlayerJoinEvent
;

export type EventList = {
    +events: GameEvent[]
}

export type EventListDispatch = (GameEvent) => any;

export function eventListReducer(state: EventList, event: GameEvent): EventList {
    return { events: [event, ...state.events] };
}

export const EventListCtx = React.createContext<EventList>({ events: [] });
export const EventDispatchCtx = React.createContext<EventListDispatch>(() => {});
