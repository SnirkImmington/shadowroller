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
    +players: { [string]: string }
|};

export type Action =
| { +ty: "join", gameID: string, player: Player, players: { [string]: string } }
| { +ty: "connect", connected: bool }
| { +ty: "playerName", name: string }
| { +ty: "setPlayers", players: { [string]: string } }
| { +ty: "newPlayer", name: string, id: string }
;

function reduceMain(state: State, action: Action): State {
    switch (action.ty) {
        case "join":
            console.log("Joined game");
            return {
                connected: true,
                gameID: action.gameID,
                player: action.player,
                players: action.players
            }
        case "connect":
            if (!state) { return state; }
            return {
                ...state,
                connected: action.connected,
            }
        case "playerName":
            if (!state) { return state; }
            return {
                ...state,
                player: { ...state.player, name: action.name },
            };
        case "newPlayer":
            if (!state) { return state; }
            return {
                ...state,
                players: { [action.id]: action.name, ...state.players },
            };
        case "setPlayers":
            if (!state) { return state; }
            if (!action.players[state.player.id]) {
                action.players[state.player.id] = state.player.name;
            }
            return {
                ...state,
                players: action.players,
            };
        default:
            (action: empty); // eslint-disable-line no-unused-expressions
            return state;
    }
};


export type Reducer = (State, Action) => State;

let reduce: Reducer;
if (process.env.NODE_ENV !== 'production') {
    reduce = function(state: State, action: Action): State {
        const result = reduceMain(state, action);
        console.log(action.ty, state, action, result);
        return result;
    }
}
else {
    reduce = reduceMain;
}

export { reduce };
export type Dispatch = (Action) => void;
export const Ctx = React.createContext<State>();
export const DispatchCtx = React.createContext<Dispatch>((_) => {});
