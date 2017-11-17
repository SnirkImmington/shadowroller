// @flow
import { combineReducers } from 'redux';

import type { RollMode } from './index';
import type { RollAction } from './actions';
import type { RollState } from './state';
import type { Action } from '../state';
import { DEFAULT_ROLL_STATE } from '../state';

/**
    roll.buffer

    - BufferFetchCompleteAction: append action's buffer
    - RemoveBufferAction: remove action's
*/
function bufferReducer(buffer: Array<number> = [],
                       action: RollAction): Array<number> {
    switch (action.type) {
        case 'roll.buffer_fetch_complete':
            return [...action.newValues, ...buffer];
        case 'roll.remove_buffer':
            return [
                ...buffer.slice(0,
                        buffer.length - action.dice),
            ];
        default:
            return buffer;
    }
}

/**
    roll.isLoading

    - BufferFetchStartingAction: return true
    - bufferFetchCompleteAction: return false
*/
function isLoadingReducer(isLoading: boolean = true, action: RollAction): boolean {
    switch (action.type) {
        case 'roll.buffer_fetch_starting':
            return true;
        case 'roll.buffer_fetch_complete':
            return false;
        default:
            return isLoading;
    }
}

function setDiceCountReducer(diceCount: ?number = null,
                             action: RollAction): ?number {
    if (action.type === 'roll.set_dice_count') {
        return action.dice;
    }
    else {
        return diceCount;
    }
}

function setRollModeReducer(rollMode: RollMode = DEFAULT_ROLL_STATE.selectedRollMode,
                            action: RollAction): RollMode {
    if (action.type === 'roll.set_roll_mode') {
        return action.mode;
    }
    else {
        return rollMode;
    }
}

function setRollAgainstReducer(rollAgainst: ?number = null,
                               action: RollAction): ?number {
    if (action.type === 'roll.set_roll_against') {
        return action.rollAgainst;
    }
    else {
        return rollAgainst;
    }
}

function setTestForReducer(testFor: ?number = null,
                           action: RollAction): ?number {
    if (action.type === 'roll.set_test_for') {
        return action.testFor;
    }
    else {
        return testFor;
    }
}

/**
    roll.outcomes

    - AppendOutcomeAction: action, outcomes
    - DeleteOutcomeAction: remove outcomes
*/
function outcomesReducer(outcomes: typeof (DEFAULT_ROLL_STATE.outcomes) = DEFAULT_ROLL_STATE.outcomes,
                         action: RollAction): typeof (DEFAULT_ROLL_STATE.outcomes) {
    switch (action.type) {
        case "roll.append_outcome":
            return [action.outcome, ...outcomes];
        case 'roll.delete_outcome':
            return [
                ...outcomes.slice(0, action.index),
                ...outcomes.slice(action.index + 1)
            ];
        default:
            return outcomes;
    }
}

const rollReducers = {
    buffer: bufferReducer,
    bufferIsLoading: isLoadingReducer,
    outcomes: outcomesReducer,
    selectedRollMode: setRollModeReducer,
    rollDice: setDiceCountReducer,
    rollAgainstDice: setRollAgainstReducer,
    testForDice: setTestForReducer,
};

const rollReducer: (RollState, Action) => RollState = combineReducers(rollReducers);

export default rollReducer;
