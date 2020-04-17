// @flow

import * as Game from 'game';

export const BACKEND_URL = process.env.NODE_ENV !== 'production' ?
    'http://localhost:3001/' : 'https://shadowroller.immington.industries/';

export type Connection = "offline" | "connecting" | "connected" | "disconnected";
export type SetConnection = (Connection) => void;

export function initialCookieCheck(dispatch: Game.Dispatch, setConnection: SetConnection) {
    const authMatch = document.cookie.match(/srAuth=[^.]+.([^.]+)/);
    if (!authMatch) {
        return;
    }
    const auth = JSON.parse(atob(authMatch[1]));
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
    })
}

export type JoinResponse = {
    playerID: string,
    players: Map<string, string>
};

export function requestJoin(gameID: string, playerName: string): Promise<JoinResponse> {
    const url = BACKEND_URL + 'join-game';
    const body = JSON.stringify({ gameID, playerName });
    console.log('Connecting to', url, body);

    return new Promise((resolve, reject) => {
        fetch(url, {
            credentials: 'include',
            method: 'post',
            //mode: 'cors',
            body: body,
        }).then(response => {
            console.log('Headers:');
            response.headers.forEach(h => console.log(h));
            response.json().then(json => {
                postRoll(12);
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
    console.log("Requesting players");

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

export function postRoll(count: number): Promise<bool> {
    const url = BACKEND_URL + 'roll';
    const body = JSON.stringify({ count });
    console.log('Requesting', body);

    return fetch(url, {
            method: 'post',
            //mode: 'cors',
            credentials: 'include',
            body
        }).then(response => response.ok);
}

export * from './events';
