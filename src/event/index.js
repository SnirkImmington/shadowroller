// @flow

import * as React from 'react';
import * as Game from 'game';

export type EventInfo = {|
    +id: number,
    +ts: number
|};

export type LocalRoll = {
    +ty: "localRoll",
    +dice: number[],
    id?: number
};

export type GameRoll = {
    +ty: "gameRoll",
    +playerID: string,
    +dice: number[],
    ...EventInfo
};

export type GameJoin = {
    +ty: "gameJoin",
    +gameID: string,
    id?: number
};

export type GameConnect = {
    +ty: "gameConnect",
    +connected: bool,
    id?: number
};

export type PlayerJoin = {
    +ty: "playerJoin",
    +player: Game.Player,
    ...EventInfo
};

export type Action =
| LocalRoll
| GameJoin
| GameRoll
| GameConnect
| PlayerJoin
;

export type List = {|
    +eventID: number,
    +events: Action[]
|};

export type Dispatch = (Action) => void;
export type Reducer = (List, Action) => List;

let reduce: Reducer;
function eventReduce(state: List, event: Action): List {
    if (!event.id || event.id === 0) {
        event.id = state.eventID; // Local events are negative.
    }
    return {
        eventID: state.eventID - 1,
        events: [event, ...state.events]
    };
}

if (process.env.NODE_ENV !== "production") {
    reduce = function(state: List, event: Action): List {
        const result = eventReduce(state, event);
        console.log("New event ", event);
        return result;
    }
}
else {
    reduce = eventReduce;
}

export const defaultState: List = { events: [], eventID: 0 };

export { reduce };

export const DispatchCtx = React.createContext<Dispatch>(() => {});
