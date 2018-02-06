// @flow

export type AttributeInfo = {
    +default: number
};

export const ALL_ATTRIBUTES: { [Attribute]: AttributeInfo } =
    import("./attributes.json");

export type Attribute = $Keys<typeof ALL_ATTRIBUTES>;
