// @flow

import * as React from 'react';

export type Player = {
    +id: string,
    +name: string
};

export type Game = ?{|
    +connected: bool,
    +gameID: string,
    +gameToken: string,
    +player: Player,
    +players: Player[]
|};

export type GameAction =
| { ty: "join", gameID: string, gameToken: string, player: Player, players: Player[] }
| { ty: "connect", connected: bool }
| { ty: "playerName", name: string }
| { ty: "newPlayer", name: string, id: string }
;

export function gameReducer(state: Game, action: GameAction): Game {
    switch (action.ty) {
        case "join":
            return {
                connected: true,
                gameID: action.gameID,
                gameToken: action.gameToken,
                player: action.player,
                players: action.players
            }
        case "connect":
            if (!state) { return state; }
            return {
                connected: action.connected,
                ...state
            }
        case "playerName":
            if (!state) { return state; }
            return {
                player: { name: action.name, ...state.player },
                ...state
            }
        case "newPlayer":
            if (!state) { return state; }
            return {
                players: [{ name: action.name, id: action.id }, ...state.players],
                ...state
            }
        default:
            (action: empty); // eslint-disable-line no-unused-expressions
            return state;
    }
};

export type GameDispatch = (GameAction) => any;
export const GameCtx = React.createContext<Game>();
export const GameDispatchCtx = React.createContext<GameDispatch>((_) => {});
