// @flow

/** */
type RollStatus = "Success" | "Glitched" | "Critical";

/** Represents the result of a dice roll. */
export default class RollResult {
    +dice: number[];
    +hits: number;
    +misses: number;
    +glitched: bool;
    +hit: bool;
    +critical: bool;
    +shouldDisplay: bool;
    +status: RollStatus;

    constructor(dice: number[]) {
        this.dice = dice;
        this.hits = 0;
        this.misses = 0;
        // Count the number of hits and misses.
        for (let die of dice) {
            if (typeof(die) !== 'number') {
                die = parseInt(die, 10);
            }
            if (die >= 5) {
                this.hits += 1;
            }
            else if (die === 1) {
                this.misses += 1;
            }
        }
        // Glitched: misses >= ceil(len(hits) / 2)
        this.glitched = this.misses >= Math.ceil(this.dice.length / 2);
        // Hit: hits > 0
        this.hit = this.hits > 0;
        // Critical: Glitched and not hit.
        this.critical = this.glitched && !this.hit;
        // If it's not hit but also not glitched then it's still a hit.
        // (this is reflected in `status`)
        if (!this.hit && !this.critical && !this.glitched) {
            this.hit = true;
        }

        this.shouldDisplay = this.glitched || this.dice.length > 12 || this.hits > 4;

        if (this.glitched) {
            if (this.critical) {
                this.status = "Critical";
            }
            else {
                this.status = "Glitched";
            }
        }
        else {
            this.status = "Success";
        }
    }

    toString(): string {
        let result;
        if (this.critical) {
            result = "Critical glitch!";
        }
        else if (this.glitched) {
            result = "Glitch! " + this.hits + " hits"
        }
        else {
            result = this.hits + " hits";
        }
        return result;
    }
}
