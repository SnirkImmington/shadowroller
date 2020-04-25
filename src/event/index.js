// @flow

import * as React from 'react';
import * as Game from 'game';

export type EventInfo = {|
    +id?: string,
|};

export type LocalRoll = {
    +ty: "localRoll",
    +dice: number[],
    +title: string,
    ...EventInfo
};

export type GameRoll = {
    +ty: "gameRoll",
    +playerID: string,
    +playerName: string,
    +title: string,
    +dice: number[],
    ...EventInfo
};

export type PlayerJoin = {
    +ty: "playerJoin",
    +player: Game.Player,
    ...EventInfo
};

export type Event =
| LocalRoll
| GameRoll
| PlayerJoin
;

export type List = {|
    +lastMilli: number,
    +lastOffset: number,
    +events: Event[]
|};

export type Dispatch = (Event) => void;
export type Reducer = (List, Event) => List;

let reduce: Reducer;
function eventReduce(state: List, event: Event): List {
    let currMilli = state.lastMilli, currOffset = state.lastOffset;
    if (!event.id) { // millisecond
        let now = new Date().valueOf();
        if (now <= currMilli) {
            currOffset += 1;
            event.id = `${currMilli}-${currOffset}`;
        }
        else {
            currMilli = now;
            currOffset = 0;
            event.id = `${currMilli}-${currOffset}`;
        }
    }
    else {
        const [milli, offset] = event.id.split("-", 2);
        currMilli = parseInt(milli);
        currOffset = parseInt(offset);
    }
    return {
        lastMilli: currMilli,
        lastOffset: currOffset,
        events: [event, ...state.events]
    };
}

if (process.env.NODE_ENV !== "production") {
    reduce = function(state: List, event: Event): List {
        const result = eventReduce(state, event);
        console.log("New event ", event, result);
        return result;
    }
}
else {
    reduce = eventReduce;
}

export const defaultState: List = { events: [], lastMilli: 0, lastOffset: 0 };

export { reduce };

export const DispatchCtx = React.createContext<Dispatch>(() => {});
