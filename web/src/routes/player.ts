import * as Player from 'player';

import { post } from 'server';
import type { BackendRequest } from 'server/request';

export type UpdateRequest = {
    diff: Partial<Player.Player>
}

export function update(request: UpdateRequest): BackendRequest<Partial<Player.Player>> {
    return post<UpdateRequest, Partial<Player.Player>>("player/update", request);
}
