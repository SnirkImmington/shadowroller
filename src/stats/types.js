// @flow

export type StatsType =
| "combat"
| "decking"
| "magic"
| "technomancy"
;

/** An individual stat which can affect rolls. */
export class Stat {
    name: string;
    value: number;

    constructor(name: string, value: number) {
        this.name = name;
        this.value = value;
    }
}
