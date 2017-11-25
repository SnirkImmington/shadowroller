// @flow

import type { RollState } from './roll/state';
import { DEFAULT_ROLL_STATE } from './roll/state';
import type { RollAction } from './roll/actions';

import type { CharacterState } from './character/state';
import { DEFAULT_CHARACTER_STATE } from './character/state';
import type { CharacterAction } from './character/actions';

/**
    Redux state for the app.

    Fields are marked with a `+` to incidate read-only.
*/
export type AppState = {
    +roll: RollState,
    +character: CharacterState,
};

export type Action =
// Cyclic definition, must be used here.
| RollAction
| CharacterAction
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
    character: DEFAULT_CHARACTER_STATE,
};
