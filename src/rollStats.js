// @flow

import * as Event from 'event';

export type HitsResults = {
    dice: number[],
    hits: number,
    misses: number,
    glitched: bool,
    critical: bool,
    shouldDisplay: bool,
    edged: bool,
    rounds: number,
};
export function results(event: Event.Roll | Event.EdgeRoll): HitsResults {
    const dice = event.dice ? event.dice : event.rounds.flatMap(r => r);
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
    const edged = event.dice ? true : false;
    const rounds = event.dice ? 1 : event.rounds.length;
    const shouldDisplay = (
        ((event?.rounds?.length ?? 1) > 1)
        || glitched
        || dice.length > 12
        || hits > 4
    );

    return {
        dice, hits, misses, edged, rounds,
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
