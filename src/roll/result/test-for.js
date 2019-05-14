// @flow

import RollResult from './roll-result';

import type { RollMode } from '../../roll';

export default class TestForResult {
    mode: RollMode = 'test-for';
    id: number;
    result: RollResult;
    threshold: number;

    constructor(id: number, result: RollResult, threshold: number) {
        this.id = id;
        this.result = result;
        this.threshold = threshold;
    }

    success(): boolean {
        return this.result.hits >= this.threshold;
    }
}
