import * as fc from 'fast-check';

/** Run an fc.assert test using the given generator, validator, and other params. */
export function property<T>(title: string, arbitrary: fc.Arbitrary<T>, handler: (v: T) => boolean|void, params?: fc.Parameters<[T]>): void {
    it(`fast-check it ${title}`, function() {
        fc.assert(fc.property(arbitrary, handler), params);
    });
}

/** fewerRuns is a parameter that halves the number of cases run.
    It should be used when the specifics of the given input (i.e. a player name)
    are less important than just using different inputs (i.e. different lists). */
export function fewerRuns<T>(): fc.Parameters<T> {
    return { numRuns: 50 };
}

/** Returns an array of up to 10 trimmed strings of length 1-6.
    Names do not include spaces so as to enable `getByText()`. */
export function playerNames(): fc.Arbitrary<string[]> {
    return fc.array(fc.string({ minLength: 1, maxLength: 6 }).filter(s => !s.includes(" ")), { maxLength: 10});
}

describe("playerNames()", function() {
    property("doesn't produce an empty string", playerNames(),
        (names: string[]) => names.every(n => n !== ""), fewerRuns()
    );
    property(
        "doesn't produce an untrimmed string",
        playerNames(), (names: string[]) => names.every(n => n === n.trim()),
        fewerRuns()
    );
});

/** Returns a string which could be used as a baseID for a component that
    requires a baseID. */
export function htmlID(): fc.Arbitrary<string> {
    return fc.hexaString({ maxLength: 50, minLength: 6, });
}

describe("htmlID()", function () {
    property("doesn't produce an empty string", htmlID(),
        (id: string) => id !== "", fewerRuns()
    );

    property("doesn't produce a string with spaces", htmlID(),
        (id: string) => !id.includes(" "), fewerRuns()
    );
});

/** Generate an HTML color in the form of a hex code (with leading hash). */
export function rgbColor(): fc.Arbitrary<string> {
    // Math-free version of the example given in map()'s documentation
    return fc.array(fc.integer({ min: 0, max: 256 }), { minLength: 3, maxLength: 3 })
        .map(nums => nums.map(n => n.toString(16).padStart(2, '0')))
        .map(parts => '#' + parts.join());
}

describe("rgbColor()", function () {
    property("matches #rrggbb", rgbColor(),
        c => c.search(/^#\x\x\x\x\x\x$/) === 0
    );
});

/** Generates an HTML color in the form of a named HTML color.
    Does not generate all possible named HTML colors. */
export function namedColor(): fc.Arbitrary<string> {
    return fc.constantFrom(
        "AliceBlue", "Aqua", "aquamarine",
        "beige", "Black", "blue", "cadetblue",
        "green", "khaki", "Lavender", "Plum",
        "SeaGreen", "slategray", "SlateBlue", "Yellow"
    );
}

/** Generates a string representing a number from 0-255 or a percentage, for
    use with the `hsl()` color representation. */
export function percentageOrNumberColorUnit(): fc.Arbitrary<string> {
    return fc.oneof(
        fc.integer({ min: 0, max: 100 }).map(i => `${i}%`),
        fc.integer({ min: 0, max: 256 }).map(i => i.toString())
    );
}

/** Generates a string representing an `hsl()` color. */
export function hslColor(): fc.Arbitrary<string> {
    return fc.record({
        h: percentageOrNumberColorUnit(),
        s: percentageOrNumberColorUnit(),
        l: percentageOrNumberColorUnit()
    }).map(({ h, s, l }) => `hsl(${h}, ${s}, ${l})`);
}

/** Generates a valid HTML color, either a named HTML color (i.e. "aliceblue")
    or an RGB or hsl() specified color. */
export function color(): fc.Arbitrary<string> {
    return fc.oneof(
        rgbColor(), namedColor(), hslColor()
    );
}
