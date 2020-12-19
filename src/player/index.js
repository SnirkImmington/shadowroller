// @flow

import * as React from 'react';

export type PlayerInfo = {|
    +id: string,
    +name: string,
    +hue: number
|};

export type User = {|
    ...PlayerInfo,
    +username: string,
|};

export type State = ?{|
    user: User,
|};
export const defaultState = null;

export type Action =
| { +ty: "userUpdate", values: $Shape<User> }
;

export function colorOf(player: PlayerInfo): string {
    return `hsl(${player.hue}, 80%, 56%)`;
}

export type Dispatch = (Action) => void;
export type Reducer = (State, Action) => State;

function userReduce(state: State, action: Action): State {
    switch (action.ty) {
        case "userUpdate":
            if (!state) { return state; }
            return { ...state, user: { ...state.user, ...action.values } };
        default:
            (action: empty); // eslint-disable-line no-unused-expressions
            if (process.env.NODE_ENV !== 'production') {
                console.error("userReduce: invalid action", action);
            }
            return state;
    }
}

let reduce: Reducer;
if (process.env.NODE_ENV !== 'production') {
    reduce = function(state: State, action: Action): State {
        const result = userReduce(state, action);
        console.log("Player", action.ty, state, action, result);
        return result;
    }
}
else {
    reduce = userReduce;
}

export { reduce };
export const Ctx = React.createContext<State>(defaultState);
export const DispatchCtx = React.createContext<Dispatch>((_) => {});
