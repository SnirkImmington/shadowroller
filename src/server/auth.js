// @flow

import * as Event from 'event';
import * as Game from 'game';
import routes from 'routes';
import type { BackendRequest } from 'server';
import type { SetConnection } from 'connection';
import * as server from 'server';

export type ACCESS_STATE = "loading" | "found";
export type SAVING_STATE = "saving" | "saved";

export let session: ?string = null;

export function loadCredentials() {
    session = sessionStorage.getItem("session");
    if (!session) {
        session = localStorage.getItem("session");
    }
}

export function clearSession() {
    session = null;
    sessionStorage.removeItem("session");
    localStorage.removeItem("session");
}

export function saveSession(newSession: string, persist: bool) {
    session = newSession;
    sessionStorage.setItem("session", newSession);
    if (persist) {
        localStorage.setItem("session", newSession);
    }
}

export function handleLogout(gameDispatch: Game.Dispatch, eventDispatch: Event.Dispatch) {
    gameDispatch({ ty: "leave" });
    eventDispatch({ ty: "clearEvents" });
    clearSession();
}

export function handleLogin(
    persist: bool,
    response: routes.auth.LoginResponse,
    setConnection: SetConnection,
    gameDispatch: Game.Dispatch,
    eventDispatch: Event.Dispatch
): BackendRequest<any> {
    // Prepare the players and game state
    const players = new Map<string, string>();
    for (let [k, v] of Object.entries(response.game.players)) {
        // flow-ignore-all-next-line it's being weird about Object.entries
        players.set(k, v);
    }
    gameDispatch({
        ty: "join",
        gameID: response.game.id,
        player: { id: response.playerID, name: response.playerName },
        players,
    });
    saveSession(response.session, persist);

    eventDispatch({ ty: "setHistoryFetch", state: "fetching" });
    return routes.game.getEvents({ oldest: response.lastEvent })
        .onConnection(setConnection)
        .onResponse(events => {
            events.events.forEach(server.normalizeEvent);
            eventDispatch({
                ty: "setHistoryFetch",
                state: events.more ? "ready" : "finished"
            });
            eventDispatch({
                ty: "mergeEvents", events: events.events
            });
        })
        .onAnyError(eventsErr => {
            console.error("Error fetching events:", eventsErr);
        });
}
