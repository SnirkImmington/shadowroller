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
    rerolled: bool,
    rounds: number,
};
export function results(event: Event.DiceEvent): HitsResults {
    const dice = event.dice ? event.dice : event.rounds.flatMap(r => r);
    const rerolled = event.ty === "rerollFailures";
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

    const glitched = misses > Math.ceil(dice.length / 2);
    const critical = glitched && hits === 0;
    // flow-ignore-all-next-line We're checking for null here, flow
    const edged = event?.rounds != null;
    let rounds = 1;
    if (rerolled) {
        // flow-ignore-all-next-line rerolled indicates it's a rerollFailures
        rounds = event.rounds.length - 1;
    }
    else if (event.rounds) {
        rounds = event.rounds.length;
    }
    const shouldDisplay = (
        edged
        || glitched
        || dice.length > 12
        || hits > 4
    );

    return {
        dice, hits, misses, edged, rerolled, rounds,
        glitched, critical, shouldDisplay
    }
}

export function resultMessage(results: HitsResults): string {
    const hits = results.hits === 1 ? "hit" : "hits";
    if (results.critical) {
        return "Critical glitch!"
    }
    else if (results.glitched) {
        return `Glitch! ${results.hits} ${hits}`;
    }
    else {
        return `${results.hits} ${hits}`;
    }
}
