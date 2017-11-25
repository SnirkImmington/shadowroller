// @flow
import fetch from 'isomorphic-fetch';

import type { RollOutcome } from './result';
import type { RollMode, DisplayMode } from './index';
import type { ThunkAction, DispatchFn, GetStateFn } from '../state';
import { propertiesSet, diceAvailable } from './state';

import RollResult from './result/roll-result';
import RollAgainstResult from './result/roll-against';
import TestForResult from './result/test-for';
import CountHitsResult from './result/count-hits';
import HighlightResult from './result/highlight';

const FETCH_BUFFER = 200;

const RANDOM_ORG_URL =
`https://www.random.org/integers/?num=${FETCH_BUFFER}&min=1&max=6&col=1&base=10&format=plain&rnd=new`;

/** A buffer fetch is required now.
    `state.roll.bufferIsLoading` should be true. */
export type FetchBufferAction = {
    +type: "roll.fetch_buffer",
};
export function fetchBuffer(): ThunkAction {
    return function(dispatch: DispatchFn, getState: GetStateFn) {
        dispatch(bufferFetchStarting());
        return fetch(RANDOM_ORG_URL)
            .then(response => response.text())
            .then(function(text: string) {
                const textMatches: string[] = text.split(/\s/, FETCH_BUFFER);
                const newNumbers: number[] = [];
                for (const num of textMatches) {
                    const parsed = parseInt(num, 10);
                    if (!isNaN(parsed)) {
                        newNumbers.push(parsed);
                    }
                }
                dispatch(bufferFetchComplete(newNumbers));
            });
    };
}

export type BufferFetchStartingAction = {
    +type: "roll.buffer_fetch_starting",
};
export function bufferFetchStarting(): BufferFetchStartingAction {
    return { type: "roll.buffer_fetch_starting" };
}

/** The buffer fetch is complete.
    `state.roll.bufferIsLoading` should be false.
*/
export type BufferFetchCompleteAction = {
    +type: "roll.buffer_fetch_complete",
    +newValues: Array<number>,
};
export function bufferFetchComplete(newValues: number[]): BufferFetchCompleteAction {
    return { type: "roll.buffer_fetch_complete", newValues };
}

/** Set the number of dice to roll. */
export type SetDiceCountAction = {
    +type: "roll.set_dice_count",
    +dice: ?number,
};
export function setDiceCount(dice: ?number): SetDiceCountAction {
    return { type: "roll.set_dice_count", dice };
}

/** Set the mode to roll */
export type SetRollModeAction = {
    +type: "roll.set_roll_mode",
    +mode: RollMode,
};
export function setRollMode(mode: RollMode): SetRollModeAction {
    return { type: "roll.set_roll_mode", mode };
}

/** Set the number of dice to roll against (in RollMode::"roll-against") */
export type SetRollAgainstAction = {
    +type: "roll.set_roll_against",
    +rollAgainst: ?number,
};
export function setRollAgainst(rollAgainst: ?number): SetRollAgainstAction {
    return { type: "roll.set_roll_against", rollAgainst };
}

/** Set the number of dice to test for (in RollMode::"test-for") */
export type SetTestForAction = {
    +type: "roll.set_test_for",
    +testFor: ?number,
};
export function setTestFor(testFor: ?number): SetTestForAction {
    return { type: "roll.set_test_for", testFor };
}

export type SetDisplayModeAction = {
    +type: "roll.set_display_mode",
    +mode: DisplayMode
};
export function setDisplayMode(mode: DisplayMode): SetDisplayModeAction {
    return { type: "roll.set_display_mode", mode };
}

/** Dice have been rolled, remove from buffer. */
export type RemoveBufferAction = {
    +type: "roll.remove_buffer",
    +dice: number
};
export function removeBuffer(dice: number): RemoveBufferAction {
    return { type: "roll.remove_buffer", dice };
}

/** Add a RollOutcome to the roll history. */
export type AppendOutcomeAction = {
    +type: "roll.append_outcome",
    +outcome: RollOutcome,
};
export function appendOutcome(outcome: RollOutcome): AppendOutcomeAction {
    console.log("Asked to append an outcome: ", outcome);
    return { type: "roll.append_outcome", outcome };
}

/** Remove an outcome from the roll history. */
export type DeleteOutcomeAction = {
    +type: "roll.delete_outcome",
    +index: number
};
export function deleteOutcome(index: number): DeleteOutcomeAction {
    return { type: "roll.delete_outcome", index };
}

export function performRoll(): ThunkAction {
    return function(dispatch: DispatchFn, getState: GetStateFn) {
        const state = getState().roll;

        let isReady = !state.bufferIsLoading && propertiesSet(state);
        if (isReady && !diceAvailable(state)) {
            isReady = false;
            dispatch(fetchBuffer());
        }
        if (!isReady) {
            return false;
        }

        let rollDice = state.rollDice || 0;
        const bufferLength = state.buffer.length;

        switch (state.selectedRollMode) {
            case 'count-hits': {
                const toRoll = rollDice;
                const pool = state.buffer.slice(bufferLength - toRoll);
                dispatch(removeBuffer(toRoll));
                const outcome: RollOutcome =
                    new CountHitsResult(new RollResult(pool));
                dispatch(appendOutcome(outcome));
                return true;
            }
            case 'test-for': {
                const toRoll = rollDice;
                const pool = state.buffer.slice(bufferLength - toRoll);
                dispatch(removeBuffer(toRoll));
                const outcome: RollOutcome =
                    new TestForResult(new RollResult(pool), state.testForDice || 0);
                dispatch(appendOutcome(outcome));
                return true;
            }
            case 'roll-against': {
                const userRoll = rollDice;
                const foeRoll = state.rollAgainstDice || 0;
                const userPool = state.buffer.slice(bufferLength - userRoll);
                const foePool = state.buffer.slice(bufferLength - userRoll - foeRoll, bufferLength - userRoll);
                dispatch(removeBuffer(userRoll + foeRoll));
                const outcome: RollOutcome =
                    new RollAgainstResult(new RollResult(userPool), new RollResult(foePool));
                dispatch(appendOutcome(outcome));
                return true;
            }
            case 'display': {
                const toRoll = rollDice;
                const pool = state.buffer.slice(bufferLength - toRoll);
                dispatch(removeBuffer(toRoll));
                const outcome: RollOutcome =
                    new HighlightResult(pool, state.displayMode);
                dispatch(appendOutcome(outcome));
                return true;
            }
            default:
                return false;
        }
    }
}

export type RollAction =
| FetchBufferAction
| BufferFetchStartingAction
| BufferFetchCompleteAction
| SetDiceCountAction
| SetRollModeAction
| SetRollAgainstAction
| SetTestForAction
| SetDisplayModeAction
| RemoveBufferAction
| AppendOutcomeAction
| DeleteOutcomeAction
;
