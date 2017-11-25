// @flow

import type { AttributesState } from './state';
import type { AttributeAction } from './actions';

import { DEFAULT_ATTRIBUTES_STATE } from './state';

/** Reduces all character.attribue actions. */
function attributesReducer(attributes: AttributesState = DEFAULT_ATTRIBUTES_STATE,
                                 action: AttributeAction): AttributesState {
    switch (action.type) {
        case 'character.attributes.attribute_changed':
            return {
                ...attributes,
                [action.attr]: action.newValue
            };
        default:
            return attributes;
    }
}


export default attributesReducer;
