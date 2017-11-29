// @flow

import type { SkillBase } from '.';
import type { Attribute, BaseLimit } from '..';

export type PhysicalSkillInfo = SkillBase & {
    +type: "physical",
    +baseAttribute: Attribute,
    +baseLimit: BaseLimit
};

export const ALL_PHYSICAL_SKILLS: { [PhysicalSkill]: PhysicalSkillInfo }
    = import("./physical.json");

export type PhysicalSkill = $Keys<typeof ALL_PHYSICAL_SKILLS>;
