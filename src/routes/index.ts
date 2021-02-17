import type { Info as PlayerInfo } from 'player';

import * as auth from './auth';
import * as game from './game';
import * as player from './player';

export type GameInfo = {
    id: string,
    players: Record<string, PlayerInfo>,
};

export default {
    auth,
    game,
    player,
};
