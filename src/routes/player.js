// @flow

import * as Player from 'player';

import { post } from 'server';
import type { BackendRequest } from 'server/request';

export type UpdateRequest = {
    diff: $Shape<Player.Info>
}

export function update(request: UpdateRequest): BackendRequest<void> {
    return post<UpdateRequest, void>("player/update", request);
}
