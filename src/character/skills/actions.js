// @flow

/* eslint no-use-before-define: "off" */

import type { Skill } from '../../data/skills';

export type SkillChangedAction = {
    +type: 'character.skills.skill_changed',
    +skill: Skill,
    +newValue: number
};

export function skillChanged(skill: Skill, newValue: number): SkillsAction {
    return { type: 'character.skills.skill_changed', skill, newValue };
}

export type SkillsAction =
| SkillChangedAction
;
