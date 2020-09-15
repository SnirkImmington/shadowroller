// @flow

import * as auth from './auth';
import * as game from './game';

export type GameInfo = {|
    id: string,
    players: { [string]: string },
|};

export default {
    auth,
    game,
};
