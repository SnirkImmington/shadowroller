// @flow

import * as React from 'react';

export function roll(count: number): number[] {
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(Math.floor(Math.random() * 6) + 1);
    }
    return result;
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

export function useFlavor(options: React.Node[]): React.Node {
    // eslint-disable-next-line no-unused-vars
    const [result, _] = React.useState(() => pickRandom(options));
    return result;
}

// Color generation taken from:
// https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/

// Color generator guy claims 1/golden ratio is useful to improve distribution.
const fixedOffset = Math.floor(0.618033988749895 * 360);

/// Produces a random HSL color from IDs which are base64 ecoded random bytes.
export function hashedColor(id: string): string {
    let converted: string;
    try {
        converted = atob(id);
    }
    catch {
        converted = id;
    }

    // Get a checksum of the ID to use as a unique color hue
    let sum = 0;
    for (let i = 0; i < converted.length; i++) {
        sum += converted.charCodeAt(i);
    }

    const hue = ((sum % 360) + fixedOffset) % 360;
    return `hsl(${hue}, 80%, 56%)`;
}
