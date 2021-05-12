import { Parser, Expression, lispy } from '.';

function parseText(text: string): Expression {
    const parser = new Parser(text);
    const expression = parser.expression();
    if (!expression) {
        throw new Error(`Unable to parse expression "${text}"`);
    }
    return expression;
}

function itMatches(title: string, cases: [string, string, Expression][]) {
    for (const [input, out, name ] of cases) {
        it(`${title}: ${name ?? input}`, () =>
            expect(lispy(parseText(input))).toEqual(lispy(out))
        );
    }
}

describe('parse literals', function() {
    itMatches('parses positive numbers', [
        ["0", { type: "number", value: 0 }],
        ["1", { type: "number", value: 1 }],
        ["34", { type: "number", value: 34 }],
        ["245", { type: "number", value: 245 }],
    ]);

    itMatches('parses numbers with +', [
        ["+0", { type: "number", value: 0 }],
        ["+1", { type: "number", value: 1 }],
        ["+34", { type: "number", value: 34 }],
        ["+245", { type: "number", value: 245 }],
    ]);

    itMatches('parses negative numbers', [
        ["-0", { type: "number", value: 0 }],
        ["-1", { type: "number", value: -1 }],
        ["-34", { type: "number", value: -34 }],
        ["-245", { type: "number", value: -245 }],
    ]);
})

describe('infix parsing', function() {
    itMatches('parses infix with spaces', [
        ["0+1", {
            type: "binOp", op: "+",
            left: { type: "number", value: 0 }, right: { type: "number", value: 1 }
        }],
        ["0 + 1", {
            type: "binOp", op: "+",
            left: { type: "number", value: 0 }, right: { type: "number", value: 1 }
        }],
        ["0\t+ \n1\n", {
            type: "binOp", op: "+",
            left: { type: "number", value: 0 }, right: { type: "number", value: 1 }
        }],
    ]);
    itMatches('parses infix +- with prefix exprs', [
        ["0 + -1", {
            type: "binOp", op: "+",
            left: { type: "number", value: 0 },
            right: { type: "number", value: -1 }
        }],
        ["0 + +1", {
            type: "binOp", op: "+",
            left: { type: "number", value: 0 },
            right: { type: "number", value: 1 }
        }],
        ["0 - +1", {
            type: "binOp", op: "-",
            left: { type: "number", value: 0 },
            right: { type: "number", value: 1 }
        }],
        ["-0 + 1", {
            type: "binOp", op: "+",
            left: { type: "number", value: 0 },
            right: { type: "number", value: 1 }
        }],
    ]);
});
