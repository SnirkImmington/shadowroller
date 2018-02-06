// @flow

import type { SkillsState } from './state';
import type { SkillsAction } from './actions';

import { DEFAULT_SKILLS_STATE } from './state';

function skillsReducer(skills: SkillsState = DEFAULT_SKILLS_STATE,
                       action: SkillsAction): SkillsState {
    switch (action.type) {
        case 'character.skills.skill_changed':
            return {
                ...skills,
                [action.skill]: action.newValue
            };
        default:
            return skills;
    }
}

export default skillsReducer;
