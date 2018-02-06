// @flow

import type { Skill } from '../../data/skills';
import { ALL_SKILLS } from '../../data/skills';

export type SkillsState = {
    [Skill]: number
}

let skills: SkillsState = {};
for (const skill of Object.keys(ALL_SKILLS)) {
    skills[skill] = 0;
}

export const DEFAULT_SKILLS_STATE: SkillsState = skills;
