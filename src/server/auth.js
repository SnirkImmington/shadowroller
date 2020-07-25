// @flow

import * as Game from 'game';
import * as connection from 'connection';
import localforage from 'localforage';

export type ACCESS_STATE = "loading" | "found";
export type SAVING_STATE = "saving" | "saved";

export let credentials: ?Credentials = null;
export let session: ?string = null;

export function loadCredentials() {
    const credentialsJWT = localStorage.getItem("authCredentials");
    if (credentialsJWT) {
        credentials = parseCredentials(credentialsJWT);
    }
    session = localStorage.getItem("session");
}

export type Credentials = {|
    gameID: string,
    playerID: string,
    playerName: string,
    version: number,
|};
export function parseCredentials(credentials: string): ?Credentials {
    if (!credentials) {
        return null;
    }
    let auth: any;
    try {
        // flow-ignore-all-next-line
        auth = JSON.parse(atob(credentials.match(/[^.]+([^.]+)/)));
    } catch {
        return null;
    }

    return {
        gameID: auth.gID,
        playerID: auth.pID,
        version: auth.v,
        playerName: auth.pName
    };
}

export function saveAuthCredentials(newCredentials: string): bool {
    const parsed = parseCredentials(newCredentials);
    if (!parsed) {
        return false;
    }
    credentials = parsed;
    // We save the full JWT
    localStorage.setItem("authCredentials", newCredentials);
    return true;
}

export function saveSession(newSession: string) {
    session = newSession;
    sessionStorage.setItem("session", newSession);
}
