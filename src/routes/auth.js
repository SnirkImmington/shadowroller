// @flow

import { post } from 'server';
import type { GameInfo } from 'routes';
import type { BackendRequest } from 'server/request';

export type LoginRequest = {|
    gameID: string, playerName: string, persist: bool
|};
export type LoginResponse = {|
    playerID: string,
    game: GameInfo,
    session: string,
|};
export function login(request: LoginRequest): BackendRequest<LoginResponse> {
    // flow-ignore-all-next-line
    return post<LoginRequest, LoginResponse>("auth/login", request);
}

export type ReauthRequest = {|
    session: string,
|};
export function reauth(request: ReauthRequest): BackendRequest<LoginResponse> {
    // flow-ignore-all-next-line
    return post<ReauthRequest, LoginResponse>("auth/reauth", request);
}

export function logout(): BackendRequest<void> {
    // flow-ignore-all-next-line
    return post<void, void>("auth/logout");
}
