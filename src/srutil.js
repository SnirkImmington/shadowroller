// @flow

import * as React from 'react';

export type Setter<T> = (T | (T => T)) => void;

export function rollDie(): number {
    return Math.floor(Math.random() * 6) + 1;
}

export function roll(count: number): number[] {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(rollDie());
    }
    return result;
}

export function rerollFailures(original: number[]): number[] {
    const toRoll = original.reduce(
        (curr, die) => curr + (die < 5 ? 1 : 0),
        0
    );
    return roll(toRoll);
}

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

/** Pluralizes a number in English. */
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

/** Pick a random member of an array. Only used for flavortext. */
export function pickRandom<T>(items: Array<T>): T {
    return items[Math.floor(Math.random() * items.length)];
}

export function useFlavor<T>(options: T[]): [T, () => void] {
    const [flavor, setFlavor] = React.useState(() => pickRandom(options));
    return [flavor, () => setFlavor(() => pickRandom(options))];
}

export function useToggle(initial: bool | () => bool): [bool, () => void, Setter<bool>] {
    const [value, setValue] = React.useState<bool>(initial);
    const toggle = React.useCallback(() => setValue(v => !v), [setValue]);
    return [value, toggle, setValue];
}

// This shallow comparison seems to be what react is using.
// Seen in react-redux and gaeron's react-pure-render.

export function shallowEqual(a: any, b: any) {
    if (a === b) {
        return true;
    }

    if (typeof a !== 'object' || a === null
        || typeof b !== 'object' || b === null) {
        return false;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    const bHasOwnProperty = Object.prototype.hasOwnProperty.bind(b);
    for (let i = 0; i < aKeys.length; i++) {
        if (!bHasOwnProperty(aKeys[i]) || a[aKeys[i]] !== b[bKeys[i]]) {
            return false;
        }
    }

    return true;
}

export function genRandomID(): string {
    const bytes = [0, 0, 0, 0, 0, 0].map(_ => Math.floor(Math.random() * 256));
    const chars = bytes.map(b => String.fromCharCode(b));
    return btoa(chars.join(''));
}
