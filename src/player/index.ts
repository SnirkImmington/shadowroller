import * as React from 'react';

export const OnlineModeAuto = 0;
export const OnlineModeOnline = 1;
export const OnlineModeOffline = 2;

export type OnlineMode = typeof OnlineModeAuto | typeof OnlineModeOnline | typeof OnlineModeOffline;

export interface Info {
    id: string,
    name: string,
    hue: number,
    online?: boolean,
};

export interface Player extends Info {
    username: string,
    onlineMode: OnlineMode,
};

export function colorOf(player: Info|Player): string {
    return `hsl(${player.hue}, 80%, 56%)`;
}

export type State = Player | null;
export const defaultState: State = null;

export type Action =
| { ty: "join", self: Player }
| { ty: "leave" }
| { ty: "update", values: Partial<Player> }
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
            if (process.env.NODE_ENV !== 'production') {
                const action_: never = action;
                console.error("userReduce: invalid action", action_);
            }
            return state;
    }
}

export type Dispatch = (action: Action) => void;
export type Reducer = (state: State, action: Action) => State;

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
