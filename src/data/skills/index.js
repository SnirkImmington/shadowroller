// @flow

import { ALL_SKILL_GROUPS } from './groups';
import type { SkillGroup, SkillGroupInfo } from './groups';

import { ALL_COMBAT_SKILLS } from './combat';
import type { CombatSkill, CombatSkillInfo } from './combat';

import { ALL_MAGIC_SKILLS } from './magic';
import type { MagicSkill, MagicSkillInfo } from './magic';

import { ALL_PILOTING_SKILLS } from './piloting';
import type { PilotingSkill, PilotingSkillInfo } from './piloting';

import { ALL_PHYSICAL_SKILLS } from './physical';
import type { PhysicalSkill, PhysicalSkillInfo } from './physical';

import { ALL_SOCIAL_SKILLS } from './social';
import type { SocialSkill, SocialSkillInfo } from './social';

import { ALL_TECHNICAL_SKILLS } from './technical';
import type { TechnicalSkill, TechnicalSkillInfo } from './technical';

import { ALL_TECHNO_SKILLS } from './techno';
import type { TechnoSkill, TechnoSkillInfo } from './techno';

import type { Ref } from '..';

export type SkillBase = {
    +name?: string,
    +ref?: Ref,
    +group: SkillGroup,
    +default: boolean
};

export type Skill =
| CombatSkill
| MagicSkill
| PilotingSkill
| PhysicalSkill
| SocialSkill
| TechnicalSkill
| TechnoSkill
;

export type SkillInfo =
| CombatSkillInfo
| MagicSkillInfo
| PilotingSkillInfo
| PhysicalSkillInfo
| SocialSkillInfo
| TechnicalSkillInfo
| TechnoSkillInfo
;

export {
    ALL_SKILL_GROUPS,
    ALL_COMBAT_SKILLS,
    ALL_MAGIC_SKILLS,
    ALL_PILOTING_SKILLS,
    ALL_PHYSICAL_SKILLS,
    ALL_SOCIAL_SKILLS,
    ALL_TECHNICAL_SKILLS,
    ALL_TECHNO_SKILLS
};
export type {
    SkillGroup, SkillGroupInfo,
    CombatSkill, CombatSkillInfo,
    MagicSkill, MagicSkillInfo,
    PilotingSkill, PilotingSkillInfo,
    PhysicalSkill, PhysicalSkillInfo,
    SocialSkill, SocialSkillInfo,
    TechnicalSkill, TechnicalSkillInfo,
    TechnoSkill, TechnoSkillInfo
};
