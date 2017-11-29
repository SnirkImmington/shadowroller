// @flow

import type { SkillBase } from '.';
import type { Attribute } from '..';

export type MagicSkillInfo = SkillBase & {
    +type: "magic",
    +baseAttribute: Attribute
};

export const ALL_MAGIC_SKILLS: { [MagicSkill]: MagicSkillInfo }
    = import("./magic.json");

export type MagicSkill = $Keys<typeof ALL_MAGIC_SKILLS>;
