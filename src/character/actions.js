// @flow

import type { AttributeAction } from './attributes/actions';
import type { SkillsAction } from './skills/actions';

export type NameAction = {
    +type: 'character.name.changed',
    +name: string
};

export function nameChanged(name: string): CharacterAction {
    return { type: 'character.name.changed', name };
}

export type CharacterAction =
| AttributeAction
| NameAction
;
