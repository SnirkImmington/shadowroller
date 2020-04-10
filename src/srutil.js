// @flow

import * as React from 'react';

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

export function useFlavor(options: React.Node[]): React.Node {
    // eslint-disable-next-line no-unused-vars
    const [result, _] = React.useState(() => pickRandom(options));
    return result;
}

// Color generation taken from:
// https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/

// String hash code taken from:
// https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/

// Color generator guy claims 1/golden ratio is useful to improve distribution.
const fixedOffset = 0.618033988749895 * 360;

/// Produces a random HSL color from IDs which are base64 ecoded random bytes.
export function hashedColor(id: string): string {
    // flow-ignore-line
    const hue = (Uint8Array.from(atob(id), c => c.charCodeAt(0))
        .reduce((sum, curr) => sum + curr, 0) + fixedOffset) % 360;
    return `hsl(${hue}deg, 100%, 70%)`;
}
