import * as rollStats from "./stats";

import * as Event from 'event';

describe("isGlitched()", function() {
    function itMatchesRegularRolls(inputs: (number[] | boolean)[]) {
        for (let i = 0; i < inputs.length; i += 2) {
            const [input, expected] = inputs.slice(i, i + 2) as [number[], boolean];
            it(`finds [${input.join(", ")}] to be ${expected ? "" : "not "}glitchy`, function() {
                const roll: Event.Roll = {
                    ty: "roll", id: 0, source: "local", title: "",
                    dice: input, glitchy: 0
                };
                expect(rollStats.isGlitched(roll)).toBe(expected);
            });
        }
    }
    itMatchesRegularRolls([
        [], false,
        [1], true,
        [2], false,
        [1, 2], false, // greater than one half
        [1, 1], true,
        [1, 1, 1, 2, 2, 2], false,
        [1, 1, 1, 2, 2], true,
        [2, 2], false,
    ]);

    function itMatchesRollsWithGlitchiness(inputs: (number[] | number | boolean)[]) {
        for (let i = 0; i < inputs.length; i += 3) {
            const [input, glitchy, expected] = inputs.slice(i, i + 3) as [number[], number, boolean];
            it(`finds [${input.join(", ")}] + ${glitchy} to be ${expected ? "" : "not "}glitchy`, () => {
                const roll: Event.Roll = {
                    ty: "roll", id: 0, source: "local", title: "",
                    dice: input, glitchy
                };
                expect(rollStats.isGlitched(roll)).toBe(expected);
            });
        }
    }
    itMatchesRollsWithGlitchiness([
        [], 1, true, // Maybe not the call most GMs would make, but I think the math works out.
        [6], 1, true,
        [6], 2, true,
        [1], -1, false,
        [1, 2, 3], 1, true,
        [1, 1, 1], -3, false,
    ]);

    function itMatchesRerolls(inputs: (number[] | number | boolean)[]) {
        for (let i = 0; i < inputs.length; i += 4) {
            const [round1, round2, glitchy, expected] = inputs.slice(i, i + 4) as [number[], number[], number, boolean];
            it(`finds rerolled [${round1.join(", ")}] -> [${round2.join(", ")}] ${expected ? "" : "not "}glitchy`, () => {
                const roll: Event.RerollFailures = {
                    ty: "rerollFailures", id: 0, source: "local", rollID: 0, title: "",
                    rounds: [round2, round1], glitchy
                };
                expect(rollStats.isGlitched(roll)).toBe(expected);
            });
        }
    }
    itMatchesRerolls([
        [], [], 0, false,
        [1, 2, 3], [4, 5, 6], 0, false,
        [1, 1, 2], [6, 6, 6], 0, true, // Initially a glitch
        [2, 2, 2], [1, 1, 2], 0, true, // Rerolled into a glitch
        [1, 6, 6], [1], 1, true, // 1 -> 1, glitch by glitchiness
        [6, 1, 1], [1, 1], -2, false, // cancelled by glitchiness
    ]);

    function itMatchesEdgeRolls(inputs: (number[][] | number | boolean)[]) {
        for (let i = 0; i < inputs.length; i += 3) {
            const [rounds, glitchy, expected] = inputs.slice(i, i + 3) as [number[][], number, boolean];
            it(`finds pushed [${rounds.map(r => "[" + r.join(", ") + "]")}] ${expected ? "" : "not "}glitchy`, () => {
                const roll: Event.EdgeRoll = {
                    ty: "edgeRoll", id: 0, source: "local", title: "",
                    rounds, glitchy
                };
                expect(rollStats.isGlitched(roll)).toBe(expected);
            });
        }
    }
    itMatchesEdgeRolls([
        [[1]], 0, true,
        [[1]], -1, false,
        [[4]], 1, true,
        [[1, 2, 3]], 0, false,
        [[1, 6, 6], [1, 1]], 0, true, // 1 1 1 6 6
    ]);
});
