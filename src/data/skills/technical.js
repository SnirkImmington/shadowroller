// @flow

import type { SkillBase } from '.';
import type { Attribute } from '..';

export type TechnicalSkillInfo = SkillBase & {
    +type: "technical",
    +baseAttribute: Attribute
};

export const ALL_TECHNICAL_SKILLS: { [TechnicalSkill]: TechnicalSkillInfo} =
    import("./technical.json");

export type TechnicalSkill = $Keys<typeof ALL_TECHNICAL_SKILLS>;
