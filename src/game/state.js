// @flow

export type Player = {
    +id: string,
    name: string
}

export type GameAuth = {
    +gameID: string,
    +playerID: string
}

export type PlayerState = {
    +playerName: string,
}

export type GameState = {
    playerName: string,
    players: Player[],
}
