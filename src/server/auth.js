// @flow

import * as Game from 'game';
import * as connection from 'connection';

export function getLocalAuth(): ?string {
    return localStorage.getItem("shadowroller.auth");
}

export function saveSession(session: string) {
    localStorage.setItem("shadowroller.session", session);
}
