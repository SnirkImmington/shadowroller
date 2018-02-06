// @flow

import type { AttributesState } from './attributes/state';
import { DEFAULT_ATTRIBUTES_STATE } from './attributes/state';

import type { SkillsState } from './skills/state';
import { DEFAULT_SKILLS_STATE } from './skills/state';

export type CharacterState = {
    +attributes: AttributesState,
    +name: string,
    +skills: SkillsState,
}

export const DEFAULT_CHARACTER_STATE: CharacterState = {
    attributes: DEFAULT_ATTRIBUTES_STATE,
    name: "Sombra",
    skills: DEFAULT_SKILLS_STATE
};
