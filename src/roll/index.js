// @flow

export type DisplayMode = "min" | "max" | "all";

export type CountHitsParams = {
    mode: "count-hits",
};

export type TestForParams = {
    mode: "test-for",
    testFor: number
};

export type RollAgainstParams = {
    mode: "roll-against",
    rollAgainst: number
};

export type RollParams =
| CountHitsParams
| TestForParams
| RollAgainstParams
;

export const RollModes = {
    "count-hits": {
        title: "counting hits",
        description: "Count 5s and 6s",
    },
    "test-for": {
        title: "threshold",
        description: "Test for a certain number of hits",
    },
    "roll-against": {
        title: "against",
        description: "Roll against another dice pool",
    },
};

export type RollMode = $Keys<typeof RollModes>;
