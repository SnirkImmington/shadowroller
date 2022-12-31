import * as Event from 'event';

/** sumOnes counts the number of 1s in a roll. */
function sumOnes(dice: number[]): number {
    return dice.reduce((acc, curr) => curr === 1 ? acc + 1 : acc, 0);
}

/** sumHits counts the number of hits (5 or 6) in a roll. */
function sumHits(dice: number[]): number {
    return dice.reduce((acc, curr) => curr >= 5 ? acc + 1 : acc, 0);
}

/** Whether edge was spent on the event. */
export function isEdged(event: Event.Event): boolean {
    switch (event.ty) {
        case "roll":
        case "playerJoin":
            return false;
        case "edgeRoll":
        case "rerollFailures":
            return true;
        case "initiativeRoll":
            return event.seized || event.blitzed;
        default:
            if (process.env.NODE_ENV !== "production") {
                const logEvent: never = event;
                console.error("Unexpected event ", logEvent);
            }
            return false;
    }
}

/** isGlitched determines if a roll is glitched.
    - If a glitch was rerolled, it is still a glitch.
    - A roll can be rerolled into a [critical] glitch.
    - A limit-pushed roll can also be a glitch.
 */
export function isGlitched(event: Event.DiceEvent): boolean {
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
        const allDice: number[] = event.rounds.flat();
        return (sumOnes(allDice) + event.glitchy) > (allDice.length / 2);
    }
    else {
        console.error("Called isGlitched with", event);
        throw Error(`Called isGlitched with ${event}`);
    }
}

/** HitsResults are statistics and facts about a roll. */
export type HitsResults = {
    /** Total result pool. */
    dice: number[],
    /** Total number of hits achieved. */
    hits: number,
    /** Glitchiness modifier (+- ones to glitch) requested */
    glitchy: number,
    /** Whether the roll glitched (see `isGliched`) */
    glitched: boolean,
    /** Whether the roll critically glitched */
    critical: boolean,
    /** Whether the roll is worthy of being displayed
       This currently applies for glitches, > 12 dice, or rolls with >4 hits.
     */
    shouldDisplay: boolean,
    /** Whether edge was spent on the roll */
    edged: boolean,
    /** Whether the roll was rerolled */
    rerolled: boolean,
    /** The number of times the dice were rolled:
        - 1 for regular rolls
        - 2 for second chance
        - 2+ for push the limit
     */
    rounds: number,
    /** Actions available for the roll */
    actions: {
        /** If the player can spend edge to reroll */
        canReroll: boolean,
    }
};
/** results provides `HitsResults` for the given [edged] roll. */
export function results(event: Event.DiceEvent): HitsResults {
    const dice: number[] = "dice" in event ? event.dice : event.rounds.flat();
    const rerolled = event.ty === "rerollFailures";
    const glitched = isGlitched(event);
    const hits = sumHits(dice);

    const critical = glitched && hits === 0;
    const edged = "rounds" in event;
    let rounds = 1;
    if (rerolled) {
        // @ts-ignore Didn't bother adding an event is RerollEvent.
        rounds = event.rounds.length - 1;
    }
    else if ("rounds" in event) {
        rounds = event.rounds.length;
    }
    const shouldDisplay = (
        edged
        || glitched
        || dice.length > 12
        || hits > 4
    );

    const canReroll = !rerolled && !edged;

    return {
        dice, hits, edged, rerolled, rounds,
        glitched, glitchy: event.glitchy, critical, shouldDisplay,
        actions: {
            canReroll
        }
    }
}

/** resultMessage provides text to display in a roll record. */
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
