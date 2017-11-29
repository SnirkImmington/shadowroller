// @flow

import type { Skill } from '.';

export type SkillGroupInfo = {
    name?: string,
    skills: Array<Skill>
};

export const ALL_SKILL_GROUPS: { [SkillGroup]: SkillGroupInfo }
    = import("./groups.json");

export type SkillGroup = $Keys<SkillGroupInfo>;
