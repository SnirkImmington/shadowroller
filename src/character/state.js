// @flow

import type { AttributesState } from './attributes/state';
import { DEFAULT_ATTRIBUTES_STATE } from './attributes/state';

import type { SkillsState } from './skills/state';
import { DEFAULT_SKILLS_STATE } from './skills/state';

export type CharacterState = {
    +name: string,
    +attributes: AttributesState,
    +skills: SkillsState,
}

export const DEFAULT_CHARACTER_STATE: CharacterState = {
    name: "Sombra",
    attributes: DEFAULT_ATTRIBUTES_STATE,
    skills: DEFAULT_SKILLS_STATE
};

export type { SkillsState, AttributesState };
