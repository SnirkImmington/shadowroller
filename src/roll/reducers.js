// @flow
import { combineReducers } from 'redux';

import type { RollMode, DisplayMode } from './index';
import type { RollAction } from './actions';
import type { RollState, LoadingState } from './state';
import type { Action, ThunkAction } from '../state';
import { DEFAULT_ROLL_STATE } from '../state';

/**
    roll.buffer

    - BufferFetchCompleteAction: append action's buffer
    - RemoveBufferAction: remove action's dice from the end
    - ClearBufferAction: clear the first part of a buffer.
*/
function bufferReducer(buffer: Array<number> = [],
                       action: RollAction): Array<number> {
    let newBuffer: number[];
    switch (action.type) {
        case 'roll.buffer_fetch_complete':
            newBuffer = [...action.newValues, ...buffer];
            break;
        case 'roll.remove_buffer':
            // Set the buffer to the first ones.
            newBuffer = buffer.slice(0, buffer.length - action.dice);
            break;
        case 'roll.clear_buffer':
            newBuffer = [];
            break;
        default:
            newBuffer = buffer;
            break;
    }
    return newBuffer;
}

/**
    roll.isLoading

    - BufferFetchStartingAction: return true
    - bufferFetchCompleteAction: return false
*/
function bufferLoadingStateReducer(state: LoadingState = "loading", action: RollAction): LoadingState {
    switch (action.type) {
        case 'roll.buffer_fetch_starting':
            return "loading";
        case 'roll.buffer_fetch_complete':
            return "complete";
        case 'roll.buffer_fetch_failed':
            return "failed";
        default:
            return state;
    }
}

function bufferSetLocalReducer(local: boolean = false, action: RollAction): boolean {
    if (action.type === 'roll.buffer_set_local_status') {
        return action.local;
    }
    else {
        return local;
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

function setDisplayModeReducer(mode: DisplayMode = "max",
                                    action: RollAction): DisplayMode {
    if (action.type === 'roll.set_display_mode') {
        return action.mode;
    }
    else {
        return mode;
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

function outcomePageReducer(page: number = 1, action: RollAction): number {
    if (action.type === "roll.select_page") {
        return action.page;
    }
    else {
        return page;
    }
}

const rollReducers: { [$Keys<RollState>]: (any, RollAction) => any } = {
    buffer: bufferReducer,
    bufferLoadState: bufferLoadingStateReducer,
    bufferIsLocal: bufferSetLocalReducer,
    outcomes: outcomesReducer,
    selectedRollMode: setRollModeReducer,
    rollDice: setDiceCountReducer,
    rollAgainstDice: setRollAgainstReducer,
    displayMode: setDisplayModeReducer,
    outcomePage: outcomePageReducer,
    testForDice: setTestForReducer,
};

const rollReducer: (RollState, Action | ThunkAction) => RollState = combineReducers(rollReducers);

export default rollReducer;
