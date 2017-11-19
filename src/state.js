// @flow

import { Attributes } from './character/attributes';
import type { AttributesState } from './character/attributes/state';
import type { AttributeAction } from './character/attributes/actions';

import type { RollState } from './roll/state';
import { DEFAULT_ROLL_STATE } from './roll/state';
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

/** Default state of the app. */
export const DEFAULT_STATE: AppState = {
    roll: DEFAULT_ROLL_STATE,
};
