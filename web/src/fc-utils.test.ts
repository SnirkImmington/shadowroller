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
