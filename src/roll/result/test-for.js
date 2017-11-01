// @flow

import RollResult from './roll-result';

export default class TestForResult {
    result: RollResult;
    threshold: number;
    mode: 'test-for';

    constructor(result: RollResult, threshold: number) {
        this.mode = 'test-for';
        this.result = result;
        this.threshold = threshold;
    }

    success(): boolean {
        return this.result.hits >= this.threshold;
    }
}
