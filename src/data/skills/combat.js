// @flow

import type { SkillBase } from '.';

export type CombatSkillInfo = SkillBase & {
    type: "combat"
};

export const ALL_COMBAT_SKILLS: { [CombatSkill]: CombatSkillInfo } =
    import("./combat.json");

export type CombatSkill = $Keys<typeof ALL_COMBAT_SKILLS>;
