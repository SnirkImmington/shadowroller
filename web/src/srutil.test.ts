import * as srutil from './srutil';


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
