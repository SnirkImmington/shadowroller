// @flow

import * as React from 'react';

import * as Game from 'game';

export type EventInfo = {|
    +id: number,
    +ts: number
|};

export type LocalRollEvent = {|
    +ty: "localRoll",
    +dice: number[],
    id?: number
|};

export type GameRollEvent = {|
    +ty: "gameRoll",
    +playerID: string,
    +dice: number[],
    ...EventInfo
|};

export type GameJoinEvent = {|
    +ty: "gameJoin",
    +gameID: string,
    id?: number
|};

export type GameConnectEvent = {|
    +ty: "gameConnect",
    +connected: bool,
    id?: number
|};

export type PlayerJoinEvent = {|
    +ty: "playerJoin",
    +player: Game.Player,
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
    +eventID: number,
    +events: GameEvent[]
}

export type EventDispatch = (GameEvent) => void;

export function eventListReducer(state: EventList, event: GameEvent): EventList {
    if (!event.id || event.id === 0) {
        event.id = state.eventID; // Local events are negative.
    }
    return {
        eventID: state.eventID - 1,
        events: [event, ...state.events]
    };
}

export const EventDispatchCtx = React.createContext<EventDispatch>(() => {});
