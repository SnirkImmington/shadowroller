import type { Info as PlayerInfo } from 'player';

export * as auth from './auth';
export * as game from './game';
export * as player from './player';

export type GameInfo = {
    id: string,
    players: Record<string, PlayerInfo>,
};
