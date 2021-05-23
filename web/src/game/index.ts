import * as React from 'react';

import type { Info as PlayerInfo } from 'player';

/** Game is the state of a currently-connected online game. */
export type Game = {
    /** Unique ID for the game */
    gameID: string,
    /** Info we know about players in the game. */
    players: Map<string, PlayerInfo>
    /** Who the GMs are in the game. */
    gms: string[]
};

/** Currently connected game (null if not connected) */
export type State = Game | null;
export const defaultState: State = null;

/** Updates to game state */
export type Action =
| { ty: "join", gameID: string, players: Map<string, PlayerInfo>, gms: string[] }
| { ty: "leave" }
| { ty: "newPlayer", player: PlayerInfo }
| { ty: "deletePlayer", id: string }
| { ty: "updatePlayer", id: string, diff: Partial<PlayerInfo> }
| { ty: "setPlayers", players: Map<string, PlayerInfo> }
;

function gameReduce(state: State, action: Action): State {
    switch (action.ty) {
        case "join":
            return {
                gameID: action.gameID,
                gms: action.gms,
                players: action.players
            };
        case "leave":
            return null;
        case "newPlayer":
            if (!state) { return state; }
            const addedPlayers = new Map(state.players);
            addedPlayers.set(action.player.id, action.player);
            return { ...state, players: addedPlayers };
        case "deletePlayer":
            if (!state) { return state; }
            const deletedPlayers = new Map(state.players);
            if (!state.players.get(action.id)) {
                return state;
            }
            deletedPlayers.delete(action.id);
            return { ...state, players: deletedPlayers };
        case "updatePlayer":
            if (!state) { return state; }
            const existing = state.players.get(action.id);
            const updatedPlayers = new Map(state.players);
            if (!existing) {
                if (process.env.NODE_ENV === "development") {
                    console.error("gameReduce: no player found for", action, "in", state);
                }
                return state;
            }
            const updatedPlayer = { ...existing, ...action.diff };
            updatedPlayers.set(action.id, updatedPlayer);
            return { ...state, players: updatedPlayers };
        case "setPlayers":
            if (!state) { return state; }
            return {
                ...state,
                players: action.players,
            };
        default:
            if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
                const action_: never = action;
                console.error("GameReduce: invalid action", action_);
            }
            return state;
    }
}

export type Reducer = (state: State, action: Action) => State;
let reduce: Reducer;
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
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
