import * as React from 'react';

import type { Info as PlayerInfo } from 'player';

export type Game = {
    gameID: string,
    players: Map<string, PlayerInfo>
};

export type State = Game | null;
export const defaultState: State = null;

export type Action =
| { ty: "join", gameID: string, players: Map<string, PlayerInfo> }
| { ty: "leave" }
| { ty: "playerUpdate", id: string, update: Partial<PlayerInfo> }
| { ty: "setPlayers", players: Map<string, PlayerInfo> }
;

function gameReduce(state: State, action: Action): State {
    switch (action.ty) {
        case "join":
            return {
                gameID: action.gameID,
                players: action.players
            };
        case "leave":
            return null;
        case "playerUpdate":
            if (!state) { return state; }
            const existing = state.players.get(action.id);
            const updatedPlayers = new Map(state.players);
            if (!existing) {
                updatedPlayers.set(action.id, action.update);
            }
            else {
                const updatedPlayer = { ...existing, ...action.update };
                updatedPlayers.set(action.id, updatedPlayer);
            }
            return { ...state, players: updatedPlayers };
        case "setPlayers":
            if (!state) { return state; }
            return {
                ...state,
                players: action.players,
            };
        default:
            if (process.env.NODE_ENV !== 'production') {
                const action_: never = action;
                console.error("GameReduce: invalid action", action_);
            }
            return state;
    }
}

export type Reducer = (state: State, action: Action) => State;
let reduce: Reducer;
if (process.env.NODE_ENV !== 'production') {
    reduce = function(state: State, action: Action): State {
        const result = gameReduce(state, action);
        console.log("Game", action.ty, state, action, result);
        return result;
    }
}
else {
    reduce = gameReduce;
}

export { reduce };
export type Dispatch = (action: Action) => void;
export const Ctx = React.createContext<State>(defaultState);
export const DispatchCtx = React.createContext<Dispatch>((_) => {});
