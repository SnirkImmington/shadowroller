// @flow

import { post } from 'server';
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
    playerName: string,
    game: GameInfo,
    session: string,
    lastEvent: string,
|};
export function login(request: LoginRequest): BackendRequest<LoginResponse> {
    return post<LoginRequest, LoginResponse>("auth/login", request);
}

export type ReauthRequest = {|
    session: string,
|};
export function reauth(request: ReauthRequest): BackendRequest<LoginResponse> {
    return post<ReauthRequest, LoginResponse>("auth/reauth", request);
}

export function logout(): BackendRequest<void> {
    return post<void, void>("auth/logout");
}
