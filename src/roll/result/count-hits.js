// @flow

import RollResult from './roll-result';

import type { RollMode } from 'roll';

export default class CountHitsResult {
    mode: RollMode = 'count-hits';
    id: number;
    result: RollResult;

    constructor(id: number, result: RollResult) {
        this.id = id;
        this.result = result;
    }
}
