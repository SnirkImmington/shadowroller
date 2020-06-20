// @flow

import * as Event from 'event';

export type HitsResults = {
    hits: number,
    misses: number,
    glitched: bool,
    critical: bool,
    shouldDisplay: bool,
};
export function results(event: Event.EventRoll): HitsResults {
    const dice = event.dice;
    let hits = 0;
    let misses = 0;

    for (const die of dice) {
        if (die >= 5) {
            hits++;
        }
        else if (die === 1) {
            misses++;
        }
    }

    const glitched = misses >= Math.ceil(dice.length / 2);
    const critical = glitched && hits === 0;
    const shouldDisplay = glitched || dice.length > 12 || hits > 4;

    return {
        hits, misses,
        glitched, critical, shouldDisplay
    }
}

export function resultMessage(results: HitsResults): string {
    if (results.critical) {
        return "Critical glitch!"
    }
    else if (results.glitched) {
        return `Glitch! ${results.hits} hits`;
    }
    else {
        return `${results.hits} hits`;
    }
}
