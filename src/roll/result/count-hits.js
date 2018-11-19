// @flow

import RollResult from './roll-result';

import type { RollMode } from '../../roll';

export default class CountHitsResult {
    mode: RollMode = 'count-hits';
    result: RollResult;

    constructor(result: RollResult) {
        this.result = result;
    }
}
