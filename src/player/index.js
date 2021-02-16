// @flow

import * as React from 'react';

export type OnlineMode = typeof OnlineModeAuto | typeof OnlineModeOnline | typeof OnlineModeOffline;

export const OnlineModeAuto = 0;
export const OnlineModeOnline = 1;
export const OnlineModeOffline = 2;

export type Info = {|
    +id: string,
    +name: string,
    +hue: number,
    +online?: bool,
|};

export type Player = {|
    ...Info,
    +username: string,
    +onlineMode: OnlineMode,
|};

export function colorOf(player: Info|Player): string {
    return `hsl(${player.hue}, 80%, 56%)`;
}

export type State = ?Player;
export const defaultState: State = null;

export type Action =
| { +ty: "join", self: Player }
| { +ty: "leave" }
| { +ty: "update", values: $Shape<Player> }
;

function userReduce(state: State, action: Action): State {
    switch (action.ty) {
        case "join":
            return action.self;
        case "leave":
            return null;
        case "update":
            if (!state) { return state; }
            return { ...state, ...action.values };
        default:
            (action: empty); // eslint-disable-line no-unused-expressions
            if (process.env.NODE_ENV !== 'production') {
                console.error("userReduce: invalid action", action);
            }
            return state;
    }
}

export type Dispatch = (Action) => void;
export type Reducer = (State, Action) => State;

let reduce: Reducer;
if (process.env.NODE_ENV !== 'production') {
    reduce = function(state: State, action: Action): State {
        const result = userReduce(state, action);
        console.log("Reduce Player", action.ty, state, action, result);
        return result;
    }
}
else {
    reduce = userReduce;
}

export { reduce };
export const Ctx = React.createContext<State>(defaultState);
export const DispatchCtx = React.createContext<Dispatch>((_) => {});
