// @flow

import type { PlayerInfo } from 'player';

import * as auth from './auth';
import * as game from './game';

export type GameInfo = {|
    id: string,
    players: { [string]: PlayerInfo },
|};

export default {
    auth,
    game,
};
