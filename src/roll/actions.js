// @flow

/* eslint no-use-before-define: "off" */
// ^ I want to assert all the functions return the generic AttributeAction
// even though it's defined at the end.

import fetch from 'isomorphic-fetch';

import type { RollOutcome } from './result';
import type { RollMode, DisplayMode } from './index';
import type { ThunkAction, DispatchFn, GetStateFn } from '../state';
import { propertiesSet, diceAvailable } from './state';

import RollResult from './result/roll-result';
import RollAgainstResult from './result/roll-against';
import TestForResult from './result/test-for';
import CountHitsResult from './result/count-hits';
import DisplayResult from './result/display';

const FETCH_BUFFER = 200;

const RANDOM_ORG_URL =
`https://www.random.org/integers/?num=${FETCH_BUFFER}&min=1&max=6&col=1&base=10&format=plain&rnd=new`;

/** Fetch new numbers from random.org. */
export function fetchBuffer(): ThunkAction {
    return function(dispatch: DispatchFn, getState: GetStateFn) {
        dispatch(bufferFetchStarting());
        if (getState().roll.bufferIsLocal) {
            const newNumbers: number[] = [];
            for (let i = 0; i < FETCH_BUFFER; i++) {
                const num = Math.floor(Math.random() * 6) + 1;
                newNumbers.push(num);
            }
            return dispatch(bufferFetchComplete(newNumbers));
        }
        else {
            return fetch(RANDOM_ORG_URL)
            .then(function(response) {
                return response.text();
            })
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
            })
            .catch(function(error: Error) {
                dispatch(bufferFetchFailed());
            });
        }
    };
}

/** The buffer fetch is starting.
    `state.roll.bufferState === "loading"`
*/
export type BufferFetchStartingAction = {
    +type: "roll.buffer_fetch_starting",
};
export function bufferFetchStarting(): RollAction {
    return { type: "roll.buffer_fetch_starting" };
}

/** The buffer fetch is complete.
    `state.roll.bufferState === "complete"`
*/
export type BufferFetchCompleteAction = {
    +type: "roll.buffer_fetch_complete",
    +newValues: Array<number>,
};
export function bufferFetchComplete(newValues: number[]): RollAction {
    return { type: "roll.buffer_fetch_complete", newValues };
}

/** The buffer fetch failed.
    `state.roll.bufferState === "failed"`
*/
export type BufferFetchFailedAction = {
    +type: "roll.buffer_fetch_failed",
};
export function bufferFetchFailed(): RollAction {
    return { type: "roll.buffer_fetch_failed" };
}

/** The buffer needs to be cleared in order to transition to being online. */
export type ClearBufferAction = {
    +type: "roll.clear_buffer",
};
export function clearBuffer(): RollAction {
    return { type: "roll.clear_buffer" };
}

/** The buffer is being set to local/not local. */
export type BufferSetLocalAction = {
    +type: "roll.buffer_set_local_status",
    +local: boolean,
};
export function bufferSetLocal(local: boolean): RollAction {
    return { type: "roll.buffer_set_local_status", local };
}

/** Set the number of dice to roll. */
export type SetDiceCountAction = {
    +type: "roll.set_dice_count",
    +dice: ?number,
};
export function setDiceCount(dice: ?number): RollAction {
    return { type: "roll.set_dice_count", dice };
}

/** Set the mode to roll */
export type SetRollModeAction = {
    +type: "roll.set_roll_mode",
    +mode: RollMode,
};
export function setRollMode(mode: RollMode): RollAction {
    return { type: "roll.set_roll_mode", mode };
}

/** Set the number of dice to roll against (in RollMode::"roll-against") */
export type SetRollAgainstAction = {
    +type: "roll.set_roll_against",
    +rollAgainst: ?number,
};
export function setRollAgainst(rollAgainst: ?number): RollAction {
    return { type: "roll.set_roll_against", rollAgainst };
}

/** Set the number of dice to test for (in RollMode::"test-for") */
export type SetTestForAction = {
    +type: "roll.set_test_for",
    +testFor: ?number,
};
export function setTestFor(testFor: ?number): RollAction {
    return { type: "roll.set_test_for", testFor };
}

export type SetDisplayModeAction = {
    +type: "roll.set_display_mode",
    +mode: DisplayMode
};
export function setDisplayMode(mode: DisplayMode): RollAction {
    return { type: "roll.set_display_mode", mode };
}

/** Dice have been rolled, remove from buffer. */
export type RemoveBufferAction = {
    +type: "roll.remove_buffer",
    +dice: number
};
export function removeBuffer(dice: number): RollAction {
    return { type: "roll.remove_buffer", dice };
}

/** Add a RollOutcome to the roll history. */
export type AppendOutcomeAction = {
    +type: "roll.append_outcome",
    +outcome: RollOutcome,
};
export function appendOutcome(outcome: RollOutcome): RollAction {
    return { type: "roll.append_outcome", outcome };
}

/** Remove an outcome from the roll history. */
export type DeleteOutcomeAction = {
    +type: "roll.delete_outcome",
    +index: number
};
export function deleteOutcome(index: number): RollAction {
    return { type: "roll.delete_outcome", index };
}

/** Set the given page (via user input, or when action is added) */
export type SelectPageAction = {
    +type: "roll.select_page",
    +page: number
};
export function selectPage(page: number): SelectPageAction {
    return { type: "roll.select_page", page };
}

export function performRoll(): ThunkAction {
    return function(dispatch: DispatchFn, getState: GetStateFn) {
        const state = getState().roll;

        let isReady = (state.bufferLoadState !== "loading") && propertiesSet(state);
        if (isReady && !diceAvailable(state)) {
            isReady = false;
            dispatch(fetchBuffer());
        }
        if (!isReady) {
            return false;
        }

        let rollDice = state.rollDice || 0;
        const bufferLength = state.buffer.length;
        let toRoll: number = 0
        let outcome: ?RollOutcome = null;

        switch (state.selectedRollMode) {
            case 'count-hits': {
                toRoll = rollDice;
                const pool = state.buffer.slice(bufferLength - toRoll);
                if (pool.length === toRoll) {
                    outcome = new CountHitsResult(new RollResult(pool));
                }
                break;
            }
            case 'test-for': {
                toRoll = rollDice;
                const pool = state.buffer.slice(bufferLength - toRoll);
                if (pool.length === toRoll) {
                    outcome = new TestForResult(new RollResult(pool), state.testForDice || 0);
                }
                break;
            }
            case 'roll-against': {
                const userRoll = rollDice;
                const foeRoll = state.rollAgainstDice || 0;
                toRoll = userRoll + foeRoll;
                const userPool = state.buffer.slice(bufferLength - userRoll);
                const foePool = state.buffer.slice(bufferLength - userRoll - foeRoll, bufferLength - userRoll);
                if (userPool.length + foePool.length === toRoll) {
                    outcome = new RollAgainstResult(new RollResult(userPool), new RollResult(foePool));
                }
                break;
            }
            case 'display': {
                toRoll = rollDice;
                const pool = state.buffer.slice(bufferLength - toRoll);
                if (pool.length === toRoll) {
                    outcome = new DisplayResult(pool, state.displayMode);
                }
                break;
            }
            default: break;
        }

        if (outcome != null) {
            dispatch(removeBuffer(toRoll));
            dispatch(appendOutcome(outcome));
            dispatch(selectPage(1));
            return true;
        }
        return false;
    }
}

export type RollAction =
| BufferFetchStartingAction
| BufferFetchCompleteAction
| BufferFetchFailedAction
| BufferSetLocalAction
| ClearBufferAction
| SetDiceCountAction
| SetRollModeAction
| SetRollAgainstAction
| SetTestForAction
| SetDisplayModeAction
| RemoveBufferAction
| AppendOutcomeAction
| DeleteOutcomeAction
| SelectPageAction
;
