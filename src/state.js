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
| RollAction
;

/** Thunk action arg that gets the state. */
export type GetStateFn = () => AppState;

/** Thunk action arg that dispatches an action. */ // eslint-disable-next-line no-use-before-define
export type DispatchFn = (action: Action | Array<Action> | Promise<Action> | ThunkAction) => mixed;

/** Thunk action. */
export type ThunkAction = (dipatch: DispatchFn, getState: GetStateFn) => mixed;


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

export const DEFAULT_STATE: AppState = {
    roll: DEFAULT_ROLL_STATE,
};
