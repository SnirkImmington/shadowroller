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

export type PlayerJoin = {
    +ty: "playerJoin",
    +player: Game.Player,
    ...EventInfo
};

export type Event =
| LocalRoll
| GameJoin
| GameRoll
| PlayerJoin
;

export type List = {|
    +events: Event[]
|};

export type Dispatch = (Event) => void;
export type Reducer = (List, Event) => List;

let reduce: Reducer;
function eventReduce(state: List, event: Event): List {
    return {
        events: [event, ...state.events]
    };
}

if (process.env.NODE_ENV !== "production") {
    reduce = function(state: List, event: Event): List {
        const result = eventReduce(state, event);
        console.log("New event ", event);
        return result;
    }
}
else {
    reduce = eventReduce;
}

export const defaultState: List = { events: [] };

export { reduce };

export const DispatchCtx = React.createContext<Dispatch>(() => {});
