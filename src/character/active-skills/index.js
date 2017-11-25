// @flow

import type { RollInfo } from '../../data';

export const SKILL_GROUPS = require('../../data/groups.json');

export const ACTIVE_SKILLS = require('../../data/active-skillz.json');

export type ActionData =
| { type: "active", roll: RollInfo }
;

export type SkillGroupData = {
    name?: string,
    skills: Skill[]
};

export type SkillData = {
    name?: string,
    group: ?SkillGroup,
    default: boolean,
    action?: ActionData,
};

export type SkillGroup = $Keys<typeof SKILL_GROUPS>;
export type Skill = $Keys<typeof SKILLS>;
