// @flow

import * as React from 'react';

import type { PlayerInfo } from 'player';

export type State = ?{|
    +gameID: string,
    +players: Map<string, PlayerInfo>
|};

export const defaultState: State = null;

export type Action =
| { +ty: "join", gameID: string, players: Map<string, PlayerInfo> }
| { +ty: "leave" }
| { +ty: "newPlayer", info: PlayerInfo }
| { +ty: "playerUpdate", id: string, update: $Shape<PlayerInfo> }
| { +ty: "setPlayers", players: Map<string, PlayerInfo> }
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
        case "newPlayer":
            if (!state) { return state; }
            const newPlayerPlayers = new Map(state.players);
            newPlayerPlayers.set(action.info.id, action.info);
            return {
                ...state,
                players: newPlayerPlayers,
            };
        case "playerUpdate":
            if (!state) { return state; }
            const existing = state.players.get(action.id);
            if (!existing) {
                if (process.env.NODE_ENV !== 'production') {
                    console.error("Update for unknown player ", action.id, "know of", state);
                }
                return state;
            }
            const playerUpdatePlayers = new Map(state.players);
            const updated = { ...existing, ...action.update };
            return { ...state, players: playerUpdatePlayers };
        case "setPlayers":
            if (!state) { return state; }
            return {
                ...state,
                players: action.players,
            };
        default:
            (action: empty); // eslint-disable-line no-unused-expressions
            if (process.env.NODE_ENV !== 'production') {
                console.error("GameReduce: invalid action", action);
            }
            return state;
    }
}


export type Reducer = (State, Action) => State;

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
export type Dispatch = (Action) => void;
export const Ctx = React.createContext<State>(defaultState);
export const DispatchCtx = React.createContext<Dispatch>((_) => {});

export { JoinMenu } from './join-menu';
export { StatusMenu } from './status-menu';
export { ReconnectMenu } from './reconnect-menu';
