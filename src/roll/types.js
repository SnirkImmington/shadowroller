// @flow

export type CountHitsParams = {|
    mode: "count-hits",
|};

export type TestForParams = {|
    mode: "test-for",
    testFor: number
|}

export type RollAgainstParams = {|
    mode: "roll-against",
    rollAgainst: number
|}

export type RollParams =
| CountHitsParams
| TestForParams
| RollAgainstParams;

export const RollModes = {
    "count-hits": {
        title: "counting hits",
        disabled: false
    },
    "test-for": {
        title: "testing for",
        disabled: false
    },
    "roll-against": {
        title: "against",
        disabled: false
    },
    "extended": {
        title: "extended",
        disabled: true
    }
}

export type RollMode = $Keys<typeof RollModes>;
