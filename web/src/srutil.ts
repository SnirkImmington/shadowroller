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
