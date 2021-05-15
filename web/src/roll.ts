
/** rollDie() rolls a single die. */
export function die(): number {
    return Math.floor(Math.random() * 6) + 1;
}

/** roll(count) rolls count dice. */
export function dice(count: number): number[] {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(die());
    }
    return result;
}

/** rerollFailures(original) finds the dice in original which can be rerolled
    with edge (reroll failures) and produces a new roll for those dice. */
export function secondChance(original: number[]): number[] {
    const toRoll = original.reduce(
        (curr, die) => curr + (die < 5 ? 1 : 0),
        0
    );
    return dice(toRoll);
}

/** rollExploding(count) rolls an initial result of count dice, then rolls new
    pools equal to the number of hits from the previous roll.

    This follows the interpretation of Push the Limit that the "exploding" dice
    can themselves explode, as opposed to being limited to one round. */
export function explodingSixes(pool: number): number[][] {
    let remaining = pool;
    const results = [];
    while (remaining > 0) {
        let sixes = 0;
        const round = [];
        for (let i = 0; i < remaining; i++) {
            const rolled = die();
            if (rolled === 6) {
                sixes++;
            }
            round.push(rolled);
        }
        remaining = sixes;
        results.push(round);
    }
    return results;
}
