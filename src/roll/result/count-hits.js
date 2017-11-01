// @flow

import RollResult from './roll-result';

export default class CountHitsResult {
    mode: 'count-hits';
    result: RollResult;

    constructor(result: RollResult) {
        this.mode = 'count-hits';
        this.result = result;
    }
}
