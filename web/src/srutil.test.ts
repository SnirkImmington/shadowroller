import * as srutil from './srutil';

describe("rollDie()", function() {
    it("rolls within 1-6", function() {
        for (let i = 0; i < 500; i++) {
            let result = srutil.rollDie();
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(6);
        }
    });
});

describe("roll()", function() {
    it("rolls the amount of dice requested", function() {
        for (let count = 0; count < 10; count++) {
            const result = srutil.roll(count);
            expect(result).toHaveLength(count);
            for (const die of result) {
                expect(die).toBeGreaterThanOrEqual(1);
                expect(die).toBeLessThanOrEqual(6);
            }
        }
    });
});

describe("rerollFailures()", function() {
    it("produces an empty result for an empty input", function() {
        expect(srutil.rerollFailures([])).toHaveLength(0);
    });

    it("does not reroll 5 or 6", function() {
        let roll = [5, 6, 5, 6, 5, 6];
        let rerolled = srutil.rerollFailures(roll);
        expect(rerolled).toHaveLength(0);
    });

    it("rerolls 1-4", function() {
        let roll = [1, 2, 3, 4, 5, 6];
        let rerolled = srutil.rerollFailures(roll);
        expect(rerolled).toHaveLength(4);
    });
});

describe("rollExploding()", function() {
    it("produces an empty result for an empty input", function() {
        expect(srutil.rollExploding(0)).toHaveLength(0);
    });

    it("rolls 1 or more rounds which grow smaller or stay the same size", function() {
        for (let i = 1; i < 100; i++) {
            let rounds = srutil.rollExploding(i);
            let minLength = i;
            for (const round of rounds) {
                expect(round.length).toBeLessThanOrEqual(minLength);
                minLength = Math.min(minLength, round.length);
            }
        }
    });
});

describe("pluralize()", function() {
    function itMatches(values: [string, number, string][]) {
        for (const [input, count, output] of values) {
            it(`maps "${input}", ${count} = "${output}"`, function() {
                expect(srutil.pluralize(count, input)).toBe(output);
            });
        }
    }
    itMatches([
        ["", 1, ""],
        ["foo", 1, "foo"],
        ["things", 1, "things"],
        ["foo", 2, "foos"],
        ["water", 221, "waters"],
        ["hobbits", 2, "hobbitses"],
    ]);
});

describe("pickRandom()", function() {
    it("returns undefined for an empty list", function() {
        expect(srutil.pickRandom([])).toBe(undefined);
    });

    it("returns a value from a list", function() {
        const items = [1, 2, 3, 4, 5, 6];
        for (let i = 0; i < 20; i++) {
            const result = srutil.pickRandom(items);
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(6);
        }
    });
});

// Gonna skip useFlavor and useToggle based on React dependency

describe("genRandomID()", function() {
    it("produces a valid string", function() {
        for (let i = 0; i < 50; i++) {
            let id = srutil.genRandomID();
            // Can convert via btoa
            expect(btoa(id).length).toBe(12);
        }
    });
});
