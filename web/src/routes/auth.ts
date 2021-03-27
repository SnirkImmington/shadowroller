import { post } from 'server';
import type { GameInfo } from 'routes';
import type { BackendRequest } from 'server/request';

import type { Player } from 'player';

export type LoginResponse = {
    player: Player,
    game: GameInfo,
    session: string,
};

export type LoginRequest = {
    gameID: string,
    username: string,
    persist: boolean
};

export function login(request: LoginRequest): BackendRequest<LoginResponse> {
    return post<LoginRequest, LoginResponse>("auth/login", request);
}

export type ReauthRequest = {
    session: string,
};
export function reauth(request: ReauthRequest): BackendRequest<LoginResponse> {
    return post<ReauthRequest, LoginResponse>("auth/reauth", request);
}

export function logout(): BackendRequest<void> {
    return post("auth/logout", null);
}
