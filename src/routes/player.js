// @flow

import * as Player from 'player';

import { post } from 'server';
import type { BackendRequest } from 'server/request';

export type UpdateRequest = {
    diff: $Shape<Player.Player>
}

export function update(request: UpdateRequest): BackendRequest<$Shape<Player.Player>> {
    return post<UpdateRequest, $Shape<Player.Player>>("player/update", request);
}
