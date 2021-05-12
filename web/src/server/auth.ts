import * as Event from 'event';
import * as Game from 'game';
import * as Player from 'player';
import { ConnectFn } from 'sseStream';
import * as routes from 'routes';
import type { BackendRequest } from 'server';
import type { SetRetryConnection } from 'connection';
import * as server from 'server';

export type ACCESS_STATE = "loading" | "found";
export type SAVING_STATE = "saving" | "saved";

export let session: string | null = null;

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

export function saveSession(newSession: string, persist: boolean) {
    session = newSession;
    sessionStorage.setItem("session", newSession);
    if (persist) {
        localStorage.setItem("session", newSession);
    }
}

type LoginArgs = {
    persist: boolean,
    response: routes.auth.LoginResponse,
    connect: ConnectFn,
    setConnection: SetRetryConnection,
    gameDispatch: Game.Dispatch,
    playerDispatch: Player.Dispatch,
    eventDispatch: Event.Dispatch
};
export function handleLogin({
    persist, response, connect,
    setConnection, gameDispatch, playerDispatch, eventDispatch
}: LoginArgs): BackendRequest<any> {
    // Prepare the players and game state
    const players = new Map<string, Player.Info>();
    for (const [k, v] of Object.entries(response.game.players)) {
        players.set(k, v);
    }
    playerDispatch({
        ty: "join",
        self: response.player
    });
    gameDispatch({
        ty: "join",
        gameID: response.game.id,
        gms: response.game.gms,
        players,
    });
    saveSession(response.session, persist);

    connect({
        session: response.session,
        gameID: response.game.id,
        playerID: response.player.id,
        retries: 0
    });

    eventDispatch({ ty: "setHistoryFetch", state: "fetching" });
    return routes.game.getEvents({ })
        .onConnection(setConnection)
        .onResponse(resp => {
            resp.events.forEach(server.normalizeEvent);
            eventDispatch({
                ty: "setHistoryFetch",
                state: resp.more ? "ready" : "finished"
            });
            eventDispatch({
                ty: "mergeEvents", events: resp.events
            });
        })
        .onAnyError(eventsErr => {
            console.error("Error fetching events:", eventsErr);
        });
}
