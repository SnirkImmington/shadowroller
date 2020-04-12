// @flow

import * as React from 'react';

import * as Game from 'game';
import * as Event from 'event';

const BACKEND_URL = process.env.NODE_ENV !== 'production' ?
    'http://localhost:3001/' : 'https://shadowroller.immington.industries/';

export function initialCookieCheck(dispatch: Game.Dispatch, eventDispatch: Event.Dispatch) {
    const authMatch = document.cookie.match(/srAuth=[^.]+.([^.]+)/);
    if (!authMatch) {
        return;
    }
    const auth = JSON.parse(atob(authMatch[1]));
    dispatch({
        ty: "join",
        gameID: auth.gid,
        player: { id: auth.pid, name: auth.pname },
        players: {}
    });
    eventDispatch({
        ty: "gameJoin", gameID: auth.gid
    })
    getPlayers().then(players => {
        dispatch({
            ty: "setPlayers", players
        })
    })
}

export type JoinResponse = {
    playerID: string,
    players: { [string]: string }
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

export function getPlayers(): Promise<{ [string]: string }> {
    const url = BACKEND_URL + "players";
    console.log("Requesting players");

    return fetch(url, {
        method: 'get',
        //mode: 'cors',
        credentials: 'include'
    }).then(response => response.json());
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

export function useEvents() {
    const connected = React.useContext(Game.Ctx)?.connected ?? false;
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const dispatch = React.useContext(Event.DispatchCtx);

    React.useEffect(() => {
        if (!connected) {
            return;
        }
        const events = new EventSource(BACKEND_URL + "events", {
            withCredentials: true
        });
        events.onmessage = function(e) {
            console.log('Event received', e.data);
            let event;
            try {
                event = JSON.parse(e.data);
            }
            catch {
                console.log("Invalid event:", e);
                return;
            }
            const ts = Date.now();

            if (event.ty === "roll") {
                console.log('Roll:', event);
                dispatch({
                    ty: "gameRoll", id: event.id, ts,
                    playerID: event.pID,
                    dice: event.roll
                });
            }
            else if (event.ty === "playerJoin") {
                dispatch({
                    ty: "playerJoin", id: event.id, ts,
                    player: { id: event.pID, name: event.pName }
                });
            }
            else {
                console.log('Received unknown event', event);
            }
        };
        events.onopen = function() {
            console.log('Listening for events from the server.');
            dispatch({
                ty: "gameConnect", connected: true
            });
            gameDispatch({
                ty: "connect", connected: true
            });
        };
        events.onerror = function(e) {
            console.log("Error receiving events!", e)
            dispatch({
                ty: "gameConnect", connected: false
            });
            gameDispatch({
                ty: "connect", connected: false
            });
        }
        return () => {
            events.close();
            dispatch({
                ty: "gameConnect", connected: false
            });
            gameDispatch({
                ty: "connect", connected: false
            });
        }
    }, [dispatch, gameDispatch, connected]);
}
