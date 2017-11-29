// @flow
/* eslint-disable no-use-before-define */

export type Ref = {
    from: string, page: number
};

export type RollInfo = {
    roll?: (string | number)[],
    limit?: (string | number)[],
};

export type AttributeInfo = {|
    default: number
|};

export const ALL_ATTRIBUTES: { [Attribute]: AttributeInfo } =
    import("./attributes.json");
export type Attribute = $Keys<typeof ALL_ATTRIBUTES>;

export type BaseLimit = "mental" | "physical" | "social" ;
