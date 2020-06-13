// @flow

import * as React from 'react';

export type Player = {
    +id: string,
    +name: string
};

export type State = ?{|
    +connected: bool,
    +gameID: string,
    +player: Player,
    +players: Map<string, string>
|};

export const defaultState = null;

export type Action =
| { +ty: "join", gameID: string, player: Player, players: Map<string, string> }
| { +ty: "leave" }
| { +ty: "playerName", name: string }
| { +ty: "setPlayers", players: Map<string, string> }
| { +ty: "newPlayer", name: string, id: string }
;

function gameReduce(state: State, action: Action): State {
    switch (action.ty) {
        case "join":
            return {
                connected: true,
                gameID: action.gameID,
                player: action.player,
                players: action.players
            };
        case "leave":
            if (state) {
                document.cookie ="srAuth=00; Max-Age=1";
            }
            return null;
        case "playerName":
            if (!state) { return state; }
            return {
                ...state,
                player: { ...state.player, name: action.name },
            };
        case "newPlayer":
            if (!state) { return state; }
            const newPlayers = new Map(state.players);
            newPlayers.set(action.id, action.name);
            return {
                ...state,
                players: newPlayers,
            };
        case "setPlayers":
            if (!state) { return state; }
            if (!action.players.get(state.player.id)) {
                action.players.set(state.player.id, state.player.name);
            }
            return {
                ...state,
                players: action.players,
            };
        default:
            (action: empty); // eslint-disable-line no-unused-expressions
            if (process.env.NODE_ENV !== 'production') {
                console.error("GameReduce: invalid action ", action);
            }
            return state;
    }
};


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
