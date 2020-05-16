// @flow

import * as Game from 'game';
import * as Event from 'event';

import * as events from './events';

export const BACKEND_URL = process.env.NODE_ENV !== 'production' ?
    'http://localhost:3001/' : 'https://shadowroller.immington.industries/';

export type Connection = "offline" | "connecting" | "connected" | "disconnected";
export type SetConnection = (Connection) => void;

export function initialCookieCheck(dispatch: Game.Dispatch, eventDispatch: Event.Dispatch, setConnection: SetConnection) {
    let authMatch, auth;
    try {
        authMatch = document.cookie.match(/srAuth=[^.]+.([^.]+)/);
        auth = JSON.parse(atob(authMatch[1]));
    }
    catch {
        return;
    }
    if (!auth || !authMatch) {
        return;
    }
    setConnection("connecting");
    dispatch({
        ty: "join",
        gameID: auth.gid,
        player: { id: auth.pid, name: auth.pname },
        players: new Map()
    });
    getPlayers().then(players => {
        dispatch({
            ty: "setPlayers", players
        });
        setConnection("connected");
    });
    events.fetchInitialEvents('', eventDispatch);
}

export type JoinResponse = {
    playerID: string,
    players: Map<string, string>
};

export function requestJoin(gameID: string, playerName: string): Promise<JoinResponse> {
    const url = BACKEND_URL + 'join-game';
    const body = JSON.stringify({ gameID, playerName });

    return new Promise((resolve, reject) => {
        fetch(url, {
            credentials: 'include',
            method: 'post',
            //mode: 'cors',
            body: body,
        }).then(response => {
            response.json().then(json => {
                if (json.playerID && json.players) {
                    const players = new Map();
                    for (const id in json.players) {
                        players.set(id, json.players[id]);
                    }
                    json.players = players;
                    resolve(json);
                }
                else {
                    reject(json);
                }
            }).catch(parseError => {
                reject(parseError);
            });
        }).catch(webError => {
            reject(webError);
        });
    });
}

export function getPlayers(): Promise<Map<string, string>> {
    const url = BACKEND_URL + "players";

    return fetch(url, {
        method: 'get',
        //mode: 'cors',
        credentials: 'include'
    }).then(response => response.json())
    .then(obj => {
        const players = new Map();
        for (const id in obj) {
            players.set(id, obj[id]);
        }
        return players;
    });
}

type RollParams = { count: number, title: string };
export function postRoll(roll: RollParams): Promise<bool> {
    const url = BACKEND_URL + 'roll';
    const body = JSON.stringify(roll);

    return fetch(url, {
            method: 'post',
            //mode: 'cors',
            credentials: 'include',
            body
        }).then(response => response.ok);
}

export * from './events';
