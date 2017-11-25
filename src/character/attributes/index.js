// @flow

/** Data about an attribute. */
export type AttributeData = {
    full: string,
    abbrev: string,
    default: number,
};

/** Data about all possible attributes and their defaults. */
// eslint-disable-next-line no-use-before-define
export const ATTRIBUTES: { [Attribute]: AttributeData }
    = require('../../data/attributes.json');

/** Identifier of an attribute. */
export type Attribute = $Keys<typeof ATTRIBUTES>;
