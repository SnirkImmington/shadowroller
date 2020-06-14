// @flow

import * as Game from 'game';
import * as Event from 'event';
import * as connection from 'connection';

import * as events from './events';

export const BACKEND_URL = process.env.NODE_ENV === 'production' ?
    'https://shadowroller.immington.industries/'
    : document.location.toString().replace(':3000', ':3001');


// I don't wanna export these but this is the easist way to access from submodule

export function backendGet<T>(path: string, params: ?{ [string]: any }): Promise<T> {
    let url = BACKEND_URL + path;
    if (params) {
        url = `${url}?${new URLSearchParams(params).toString()}`;
    }

    return fetch(url, {
        method: 'get',
        credentials: 'include',
    }).then(response => {
        if (response.ok) {
            return response.json();
        }
        else {
            throw response;
        }
    });
}

export function backendPost(path: string, body: any, confirm: bool = false): Promise<any> {
    let url = BACKEND_URL + path;
    return fetch(url, {
        method: 'post',
        credentials: 'include',
        body: body == null ? '' : JSON.stringify(body),
    }).then(response => {
        if (confirm) {
            return response.ok;
        }
        else if (response.ok) {
            return response.json();
        }
        else {
            if (process.env.NODE_ENV !== 'production') {
                console.error("Error from POST", url, response.status, response.statusText);
            }
            throw response;
        }
    });
}

export function initialCookieCheck(
    dispatch: Game.Dispatch,
    eventsDispatch: Event.Dispatch,
    setConnection: connection.SetConnection
) {
    let authMatch, auth;
    try {
        authMatch = document.cookie.match(/srAuth=[^.]+.([^.]+)/);
        auth = JSON.parse(atob(authMatch[1]));
    }
    catch {
        if (process.env.NODE_ENV !== 'production') {
            console.error("Unable to parse auth from cookie: ", document.cookie);
        }
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
    getPlayers()
        .then(players => {
            dispatch({
                ty: "setPlayers", players
            });
            setConnection("connected");
        })
        .catch(response => {
            setConnection(connection.connectionFor(response));
        });
    eventsDispatch({ ty: "setHistoryFetch", state: "fetching" });
    events.fetchEvents({})
        .then(resp => {
            eventsDispatch({
                ty: "setHistoryFetch", state: resp.more ? "ready" : "finished"
            });
            eventsDispatch({ ty: "mergeEvents", events: resp.events });
        })
        .catch(response => {
            setConnection(connection.connectionFor(response));
        });
}

export type JoinResponse = {
    playerID: string,
    players: Map<string, string>,
    newestID: string,
};

export function requestJoin(gameID: string, playerName: string): Promise<JoinResponse> {
    return backendPost('join-game', { gameID, playerName }).then(json => {
        // We replace the players field with a map but return the rest of the json.
        if (json.playerID && json.players) {
            const players = new Map();
            for (const id in json.players) {
                players.set(id, json.players[id]);
            }
            json.players = players;
            return json;
        }
        else {
            throw Error("Could not parse join game");
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
