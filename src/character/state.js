// @flow

import type { AttributesState } from './attributes/state';
import { DEFAULT_ATTRIBUTES_STATE } from './attributes/state';

export type CharacterState = {
    +attributes: AttributesState;
    // gear
    // skills
}

export const DEFAULT_CHARACTER_STATE = {
    attributes: DEFAULT_ATTRIBUTES_STATE,
};
