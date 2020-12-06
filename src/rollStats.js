// @flow

import * as Event from 'event';

function sumOnes(dice: number[]): number {
    return dice.reduce((acc, curr) => curr === 1 ? acc + 1 : acc, 0);
}

function sumHits(dice: number[]): number {
    return dice.reduce((acc, curr) => curr >= 5 ? acc + 1 : acc, 0);
}

export function isGlitched(event: Event.DiceEvent): bool {
    if (event.ty === "roll") {
        // Glitches are phrased (p. 45) "more than half the dice you rolled show a one"
        const ones = sumOnes(event.dice);
        // We don't want to floor/ceil here as the .5 for odd lengths gives us desired behavior.
        return (ones + event.glitchy) > (event.dice.length / 2);
    }
    else if (event.ty === "rerollFailures") {
        // Given the way Second Chance is phrased, you cannot use it to negate
        // a glitch. The dice which _missed_ are re-rolled, so your pool to glitch
        // overall becomes [...hits, ...rerolled]. (If you reroll more 1s than you did
        // originally you can up a non-glitch to a glitch (or even critical glitch).)
        return (
            // we originally glitched (can't negate)
            ( (sumOnes(event.rounds[1]) + event.glitchy) > (event.rounds[1].length / 2) )
            // or pool of original hits + rerolled glitched
            || ( (sumOnes(event.rounds[0]) + event.glitchy) > (event.rounds[1].length / 2) )
        );
    }
    else if (event.ty === "edgeRoll") {
        // Given the way Push the Limit is phrased, your total dice pool includes
        // those dice that you reroll.
        // flow-ignore-all-next-line it forces flat() to be mixed
        const allDice: number[] = event.rounds.flat();
        return (sumOnes(allDice) + event.glitchy) > (allDice.length / 2);
    }
    else {
        console.error("Called isGlitched with", event);
        throw Error(`Called isGlitched with ${event}`);
    }
}

export type HitsResults = {
    dice: number[],
    hits: number,
    glitchy: number,
    glitched: bool,
    critical: bool,
    shouldDisplay: bool,
    edged: bool,
    rerolled: bool,
    rounds: number,
};
export function results(event: Event.DiceEvent): HitsResults {
    // flow-ignore-all-next-line wow flow you're bad at this
    const dice: number[] = event.dice ? event.dice : event.rounds.flat();
    const rerolled = event.ty === "rerollFailures";
    const glitched = isGlitched(event);
    // flow-ignore-all-next-line More mixed
    const hits = sumHits(dice);

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
        dice, hits, edged, rerolled, rounds,
        glitched, glitchy: event.glitchy, critical, shouldDisplay
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
