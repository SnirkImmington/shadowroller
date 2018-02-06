// @flow

import { ALL_SKILL_GROUPS } from './groups';
import type { SkillGroup } from './groups';

import { ALL_COMBAT_SKILLS } from './combat';
import type { CombatSkill } from './combat';

import { ALL_MAGIC_SKILLS } from './magic';
import type { MagicSkill } from './magic';

import { ALL_ACTIVE_SKILLS } from './active';
import type { ActiveSkill } from './active';

import { ALL_SOCIAL_SKILLS } from './social';
import type { SocialSkill } from './social';

import { ALL_TECHNICAL_SKILLS } from './technical';
import type { TechnicalSkill } from './technical';

import { ALL_VEHICULAR_SKILLS } from './vehicular';
import type { VehicularSkill } from './vehicular';

import { ALL_TECHNO_SKILLS } from './techno';
import type { TechnoSkill } from './techno';

import type { Ref } from '..';
import type { Attribute } from '..';

export type SkillType =
| "combat"
| "active"
| "technical"
| "vehicular"
| "social"
| "magic"
| "techno"
;

export type SkillInfo = {
    +name?: string,
    +ref?: Ref,
    +type: SkillType,
    +group: ?SkillGroup,
    +default: boolean,
    +attr: Attribute,
    +note?: string
};

export type Skill =
| CombatSkill
| MagicSkill
| ActiveSkill
| SocialSkill
| TechnicalSkill
| VehicularSkill
| TechnoSkill
;

export type SkillMap = { [Skill]: SkillInfo };

function appendSkills(base: SkillMap, additions: SkillMap[]) {
    for (const map of additions) {
        for (const skill of Object.keys(map)) {
            base[skill] = map[skill];
        }
    }
}

let allSkills: SkillMap = {};
appendSkills(allSkills, [
    ALL_COMBAT_SKILLS, ALL_MAGIC_SKILLS,
    ALL_ACTIVE_SKILLS, ALL_SOCIAL_SKILLS,
    ALL_TECHNICAL_SKILLS, ALL_VEHICULAR_SKILLS,
    ALL_TECHNICAL_SKILLS
]);

export const ALL_SKILLS: SkillMap = allSkills;

export {
    ALL_SKILL_GROUPS,
    ALL_COMBAT_SKILLS,
    ALL_MAGIC_SKILLS,
    ALL_ACTIVE_SKILLS,
    ALL_SOCIAL_SKILLS,
    ALL_TECHNICAL_SKILLS,
    ALL_VEHICULAR_SKILLS,
    ALL_TECHNO_SKILLS
};

export type {
    SkillGroup,
    CombatSkill,
    MagicSkill,
    ActiveSkill,
    SocialSkill,
    TechnicalSkill,
    VehicularSkill,
    TechnoSkill
};
