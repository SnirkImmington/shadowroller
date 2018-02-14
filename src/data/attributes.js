// @flow

import * as ALL_ATTRIBUTES from './attributes.json';

export type AttributeInfo = {
    +default: number,
    +max?: number
};

export type Attribute = $Keys<typeof ALL_ATTRIBUTES>;

export { ALL_ATTRIBUTES };
