// @flow

import * as Game from 'game';
import * as Event from 'event';

import * as events from './events';

export const BACKEND_URL = process.env.NODE_ENV !== 'production' ?
    'http://localhost:3001/' : 'https://shadowroller.immington.industries/';

export type Connection = "offline" | "connecting" | "connected" | "disconnected";
export type SetConnection = (Connection) => void;

function backendGet<T>(path: string, params: ?{ [string]: any }): Promise<T> {
    let url = BACKEND_URL + path;
    if (params) {
        url = `${url}?${new URLSearchParams(params).toString()}`;
    }

    return fetch(url, {
        method: 'get',
        credentials: 'include',
    }).then(response => response.json());
}

function backendPost(path: string, body: any, confirm = false): Promise<any> {
    let url = BACKEND_URL + path;
    return fetch(url, {
        method: 'post',
        credentials: 'include',
        body: body == null ? '' : JSON.stringify(body),
    }).then(response => confirm ? response.ok : response.json());
}

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
    return backendPost('join-game', { gameID, playerName }).then(json => {
        if (json.playerID && json.players) {
            const players = new Map();
            for (const id in json.players) {
                players.set(id, json.players[id]);
            }
            json.players = players;
            return json;
        }
    });
}

export function getPlayers(): Promise<Map<string, string>> {
    return backendGet('players').then(json => {
        const players = new Map();
        for (const id in json) {
            players.set(id, json[id]);
        }
        return players;
    });
}

type RollParams = { count: number, title: string };
export function postRoll(roll: RollParams): Promise<bool> {
    return backendPost('roll', roll, true);
}

export * from './events';
