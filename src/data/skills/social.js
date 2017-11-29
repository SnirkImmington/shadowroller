// @flow

import type { SkillBase } from '.';

export type SocialSkillInfo = SkillBase & {
    +type: "social"
};

export const ALL_SOCIAL_SKILLS: { [SocialSkill]: SocialSkillInfo }
    = import("./social.json");

export type SocialSkill = $Keys<typeof ALL_SOCIAL_SKILLS>;
