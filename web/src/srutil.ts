import * as React from 'react';

/** Setter is the type of the `setState` function from `React.useState`. */
export type Setter<T> = (valOrSetter: T | ((prev: T) => T)) => void;

/** Json is the type of JSON-encodable data. */
export type Json =
| null
| undefined // Can be sent to parser and back. Allows for types with undefined fields.
| boolean
| number
| string
| {}
| { [property: string]: Json } // Interestingly, TS complains if you do Record<string, Json> here
| Json[]

/** rollDie() rolls a single die. */
export function rollDie(): number {
    return Math.floor(Math.random() * 6) + 1;
}

/** roll(count) rolls count dice. */
export function roll(count: number): number[] {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(rollDie());
    }
    return result;
}

/** rerollFailures(original) finds the dice in original which can be rerolled
    with edge (reroll failures) and produces a new roll for those dice. */
export function rerollFailures(original: number[]): number[] {
    const toRoll = original.reduce(
        (curr, die) => curr + (die < 5 ? 1 : 0),
        0
    );
    return roll(toRoll);
}

/** rollExploding(count) rolls an initial result of count dice, then rolls new
    pools equal to the number of hits from the previous roll.

    This follows the interpretation of Push the Limit that the "exploding" dice
    can themselves explode, as opposed to being limited to one round. */
export function rollExploding(pool: number): number[][] {
    let remaining = pool;
    const results = [];
    while (remaining > 0) {
        let sixes = 0;
        const round = [];
        for (let i = 0; i < remaining; i++) {
            const die = rollDie();
            if (die === 6) {
                sixes++;
            }
            round.push(die);
        }
        remaining = sixes;
        results.push(round);
    }
    return results;
}

/** pluralize(count, text) pluralizes a noun to count in English by adding
    "s" or "es" if count > 1. */
export function pluralize(count: number, text: string): string {
    if (count === 1) {
        return text;
    }
    else if (text.endsWith("s")) {
        return text + "es";
    }
    else {
        return text + 's';
    }
}

/** pickRandom(items) picks a random member of items. */
export function pickRandom<T>(items: Array<T>): T {
    return items[Math.floor(Math.random() * items.length)];
}

/** useFlavor(options) wraps React.useState() by providing a shuffle() function
    instead of a setState(value) function. */
export function useFlavor<T>(options: T[]): [T, () => void] {
    const [flavor, setFlavor] = React.useState(() => pickRandom(options));
    return [flavor, () => setFlavor(() => pickRandom(options))];
}

/** useToggle(initial) wraps react.useState<boolean>() by providing a toggle()
    function instead of a setState(value) function. */
export function useToggle(initial: boolean | (() => boolean)): [boolean, () => void, Setter<boolean>] {
    const [value, setValue] = React.useState<boolean>(initial);
    const toggle = React.useCallback(() => setValue(v => !v), [setValue]);
    return [value, toggle, setValue];
}

/** genRandomID() produces a random ID which matches server's `id.GenUID()`.
    It uses 6 bytes by default. */
export function genRandomID(): string {
    const bytes = [0, 0, 0, 0, 0, 0].map(_ => Math.floor(Math.random() * 256));
    const chars = bytes.map(b => String.fromCharCode(b));
    return btoa(chars.join(''));
}
