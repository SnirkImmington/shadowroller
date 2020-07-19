// @flow

import * as Game from 'game';
import * as connection from 'connection';
import localforage from 'localforage';

export type ACCESS_STATE = "loading" | "found";
export type SAVING_STATE = "saving" | "saved";

export let credentials: ?string = null;
export let session: ?string = null;

export function getAuthCredentials(): ?string {
    return localStorage.getItem("authCredentials");
}

export function saveAuthCredentials(credentials: string) {
    localStorage.setItem("authCredentials", credentials);
}

export function saveSession(session: string) {
    sessionStorage.setItem("session", session);
}

export function getSession(): ?string {
    return sessionStorage.getItem("session");
}
