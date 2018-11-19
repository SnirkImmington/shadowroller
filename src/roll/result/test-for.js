// @flow

import RollResult from './roll-result';

import type { RollMode } from '../../roll';

export default class TestForResult {
    mode: RollMode = 'test-for';
    result: RollResult;
    threshold: number;

    constructor(result: RollResult, threshold: number) {
        this.result = result;
        this.threshold = threshold;
    }

    success(): boolean {
        return this.result.hits >= this.threshold;
    }
}
