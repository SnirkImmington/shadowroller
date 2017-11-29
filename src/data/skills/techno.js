// @flow

import type { SkillBase } from '.';

export type TechnoSkillInfo = SkillBase & {
    +type: "resonance"
};

export const ALL_TECHNO_SKILLS: { [TechnoSkill]: TechnoSkillInfo } =
    import("./techno.json");

export type TechnoSkill = $Keys<typeof ALL_TECHNO_SKILLS>;
