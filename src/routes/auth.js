// @flow

import { get, post } from 'server';
import type { GameInfo } from 'routes';
import type { BackendRequest } from 'server/request';

export type JSON =
| string
| bool
| null
| typeof undefined
| { [string]: JSON }
;

export type LoginRequest = {|
    gameID: string, playerName: string, persist: bool
|};
export type LoginResponse = {|
    playerID: string,
    game: GameInfo,
    authToken: string,
    session: string,
    lastEvent: string,
|};
export function login(request: LoginRequest): BackendRequest<LoginResponse> {
    return post<LoginRequest, LoginResponse>("auth/login", request);
}

export function logout(): BackendRequest<void> {
    return post<void, void>("auth/logout");
}
