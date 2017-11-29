// @flow

import type { AttributesState } from './attributes/state';
import { DEFAULT_ATTRIBUTES_STATE } from './attributes/state';

export type CharacterState = {
    +attributes: AttributesState,
    +name: string,
    // gear
    // skills
}

export const DEFAULT_CHARACTER_STATE: CharacterState = {
    attributes: DEFAULT_ATTRIBUTES_STATE,
    name: "Sombra"
};

type CharacterState2 = {
    attributes: {
        [Attribute]: number
    },
    skills: {
        groups: { [SkillGroup]: number },
        skills: { [Skill]: number }
    },
    gear: { [GearId]: Gear },
    bonuses: { [BonusId]: bonus },
};
