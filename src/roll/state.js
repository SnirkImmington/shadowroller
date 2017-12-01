// @flow

import type { RollMode, DisplayMode } from './index';
import type { RollOutcome } from './result';

export type LoadingState = "loading" | "complete" | "failed";

export type RollState = {
    +buffer: Array<number>,
    +bufferLoadState: LoadingState,
    +bufferIsLocal: ?boolean,
    +selectedRollMode: RollMode,
    +rollDice: ?number,
    +rollAgainstDice: ?number,
    +testForDice: ?number,
    +displayMode: DisplayMode,
    +outcomes: Array<RollOutcome>,
    +outcomePage: number
};

export const DEFAULT_ROLL_STATE: RollState = {
    buffer: [],
    bufferLoadState: "loading",
    bufferIsLocal: false,
    selectedRollMode: "count-hits",
    rollDice: null,
    rollAgainstDice: null,
    testForDice: null,
    displayMode: "max",
    outcomes: [],
    outcomePage: 1,
};

/** Whether the needed properties of the state are set to perform the roll. */
export function propertiesSet(state: RollState): boolean {
    if (state.rollDice == null) { return false; }
    switch (state.selectedRollMode) {
        case 'count-hits': return true;
        case 'test-for': return state.testForDice != null;
        case 'roll-against': return state.rollAgainstDice != null;
        case 'display': return state.displayMode != null;
        default:
            // Should not happen
            return false;
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
        case 'display':
            return (state.rollDice || 0) <= state.buffer.length;
        default:
            // Should not happen
            return true;

    }
}
