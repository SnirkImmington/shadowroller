// @flow

import type { RollMode } from './index';
import type { RollOutcome } from './result';

export type RollState = {
    +buffer: Array<number>,
    +bufferIsLoading: boolean,
    +selectedRollMode: RollMode,
    +rollDice: ?number,
    +rollAgainstDice: ?number,
    +testForDice: ?number,
    +outcomes: Array<RollOutcome>
};

/** Whether the needed properties of the state are set to perform the roll. */
export function propertiesSet(state: RollState): boolean {
    if (state.rollDice == null) { return false; }
    switch (state.selectedRollMode) {
        case 'count-hits': return true;
        case 'test-for': return state.testForDice != null;
        case 'roll-against': return state.rollAgainstDice != null;
        default: return true;
    }
}

/** Whether, assuming the properties are set, the state has enough buffer. */
export function diceAvailable(state: RollState): boolean {
    switch (state.selectedRollMode) {
        case 'count-hits':
            return (state.rollDice || 0) <= state.buffer.length;
        case 'test-for':
            return (state.rollDice || 0)
                + (state.testForDice || 0)
                <= state.buffer.length;
        case 'roll-against':
            return (state.rollDice || 0)
                + (state.testForDice || 0)
                <= state.buffer.length;
        default:
            // Should not happen?
            return true;

    }
}
