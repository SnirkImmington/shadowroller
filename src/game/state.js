// @flow

import * as React from 'react';

export type Player = {
    +id: string,
    +name: string
};

export type Game = ?{|
    +connected: bool,
    +gameID: string,
    +player: Player,
    +players: { [string]: string }
|};

export type GameAction =
| { +ty: "join", gameID: string, player: Player, players: { [string]: string } }
| { +ty: "connect", connected: bool }
| { +ty: "playerName", name: string }
| { +ty: "setPlayers", players: { [string]: string } }
| { +ty: "newPlayer", name: string, id: string }
;

function gameReduce(state: Game, action: GameAction): Game {
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

let gameReducer: (Game, GameAction) => Game;

if (process.env.NODE_ENV !== 'production') {
    gameReducer = function(state: Game, action: GameAction): Game {
        const result = gameReduce(state, action);
        console.log(action.ty, state, action, result);
        return result;
    }
}
else {
    gameReducer = gameReduce;
}

export { gameReducer };
export type GameDispatch = (GameAction) => void;
export const GameCtx = React.createContext<Game>();
export const GameDispatchCtx = React.createContext<GameDispatch>((_) => {});
