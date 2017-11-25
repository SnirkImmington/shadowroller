// @flow

/* eslint no-use-before-define: "off" */
// ^ I want to assert all the functions return the generic AttributeAction
// even though it's defined at the end.

import type { ThunkAction, DispatchFn, GetStateFn } from '../../state';

import type { Attribute } from '.';

export type AttributeChangedAction = {
    +type: "character.attributes.attribute_changed",
    +attr: Attribute,
    +newValue: number,
};

export function attributeChanged(attr: Attribute, newValue: number): AttributeAction {
    return { type: "character.attributes.attribute_changed", attr, newValue };
}

export type AttributeAction =
| AttributeChangedAction
;
