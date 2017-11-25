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

export type DisplayParams = {
    mode: "display",
    showMax: DisplayMode,
};

export type RollParams =
| CountHitsParams
| TestForParams
| RollAgainstParams
| DisplayParams
;

export const RollModes = {
    "count-hits": {
        title: "counting hits",
        description: "Count 5s and 6s",
    },
    "test-for": {
        title: "testing for",
        description: "Test for a certain number of hits",
    },
    "roll-against": {
        title: "against",
        description: "Roll against another dice pool",
    },
    "display": {
        title: "display",
        description: "Show all dice/highest/lowest roll",
    },
}

export type RollMode = $Keys<typeof RollModes>;
