// @flow

import { combineReducers } from 'redux';

import AttributesReducer from './attributes/reducers';
import SkillsReducer from './skills/reducers';

import type { CharacterAction } from './actions';

function nameReducer(name: string = "Sombra", action: CharacterAction): string {
    if (action.type === 'character.name.changed') {
        return action.name;
    }
    else {
        return name;
    }
}

const characterReducer = combineReducers({
    attributes: AttributesReducer,
    skills: SkillsReducer,
    name: nameReducer,
})

export default characterReducer;
