// @flow

import type { RollState } from './roll/state';
import type { RollAction } from './roll/actions';

/**
    Redux state for the app.

    Fields are marked with a `+` to incidate read-only.
*/
export type AppState = {
    +roll: RollState,
};

export type Action =
// Cyclic definition, must be used here.
| ThunkAction // eslint-disable-line no-use-before-define
| RollAction
;

/** Thunk action arg that gets the state. */
export type GetStateFn = () => AppState;

/** Thunk action arg that dispatches an action. */
export type DispatchFn = (Action) => void;

/** Thunk action. */
export type ThunkAction = (dipatch: DispatchFn, getState: GetStateFn) => any;


export const DEFAULT_ROLL_STATE: RollState = {
    buffer: [],
    bufferIsLoading: true,
    selectedRollMode: "count-hits",
    rollDice: null,
    rollAgainstDice: null,
    testForDice: null,
    highlightMaximum: true,
    outcomes: [],
};

export const DEFAULT_STATE: AppState = {
    roll: DEFAULT_ROLL_STATE,
};
