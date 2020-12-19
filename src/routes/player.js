// @flow

import { post } from 'server';
import type { BackendRequest } from 'server/request';

export type UpdateRequest = {}; // TODO items<Player> or whatever

export function update(request: UpdateRequest): BackendRequest<void> {
    return post<UpdateRequest, void>("player/update", request);
}
