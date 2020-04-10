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

const fixedOffset = 0.618034;

/// Produces a random HSV color from IDs which are base64 ecoded random bytes.
export function hashedColor(id: string): string {
    // We're given an ID which the backend has generated randomly for us.
    // We can either use this as a seed to seed a PRNG, or use this the result
    // of math.random to fit this guy's color generation.
    // Javascript thinks it shouldn't have seedable PRNGS (????) but fortunately
    // the bytes in the ID are supposed to be random anyway. We just need to
    // interpret them as an input to the color generation.
    // There are better ways to do this, if you want to do math that's not in the
    // standard library... but we're ultimately generating _one_ number 0-255, so
    // it doesn't really matter.
    // flow-ignore-line
    const bytes = Uint8Array.from(atob(id), c => c.charCodeAt(0))
    const seed = new DataView(bytes.buffer).getFloat32(0)
    const clampedSeed = Math.abs(Math.cos(seed)) + fixedOffset; // get to [0, 1]
    return `hsla(${clampedSeed * 360}, 70%, 90%)`
}
