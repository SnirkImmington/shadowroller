import * as roll from '.';

describe("die()", function() {
    it("rolls within 1-6", function() {
        for (let i = 0; i < 500; i++) {
            let result = roll.die();
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(6);
        }
    });
});

describe("dice()", function() {
    it("rolls the amount of dice requested", function() {
        for (let count = 0; count < 10; count++) {
            const result = roll.dice(count);
            expect(result).toHaveLength(count);
            for (const die of result) {
                expect(die).toBeGreaterThanOrEqual(1);
                expect(die).toBeLessThanOrEqual(6);
            }
        }
    });
});

describe("secondChance()", function() {
    it("produces an empty result for an empty input", function() {
        expect(roll.secondChance([])).toHaveLength(0);
    });

    it("does not reroll 5 or 6", function() {
        let dice = [5, 6, 5, 6, 5, 6];
        let rerolled = roll.secondChance(dice);
        expect(rerolled).toHaveLength(0);
    });

    it("rerolls 1-4", function() {
        let dice = [1, 2, 3, 4, 5, 6];
        let rerolled = roll.secondChance(dice);
        expect(rerolled).toHaveLength(4);
    });
});

describe("rollExploding()", function() {
    it("produces an empty result for an empty input", function() {
        expect(roll.explodingSixes(0)).toHaveLength(0);
    });

    it("rolls 1 or more rounds which grow smaller or stay the same size", function() {
        for (let i = 1; i < 100; i++) {
            let rounds = roll.explodingSixes(i);
            let minLength = i;
            for (const round of rounds) {
                expect(round.length).toBeLessThanOrEqual(minLength);
                minLength = Math.min(minLength, round.length);
            }
        }
    });
});
