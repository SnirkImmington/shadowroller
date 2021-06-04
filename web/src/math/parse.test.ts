import { Parser, Expression, BinOp, lispy, texty } from '.';
import { property } from 'fc-utils.test';
import * as exprGen from './expression.gen';

function parseText(text: string): Expression {
    const parser = new Parser(text);
    const expression = parser.expression();
    if (!expression) {
        throw new Error(`Unable to parse expression "${text}"`);
    }
    return expression;
}

function itMatches(title: string, cases: (string | Expression)[]) {
    expect(cases.length % 2).toBe(0);
    for (let i = 0; i < cases.length; i += 2) {
        let input = cases[i] as string;
        let output = cases[i+1] as Expression;
        it(`${title}: ${input}`, () =>
            expect(lispy(parseText(input))).toEqual(lispy(output))
        );
    }
}

describe('parse literals', function() {
    itMatches('positive numbers', [
        "0", { type: "number", value: 0 },
        "1", { type: "number", value: 1 },
        "34", { type: "number", value: 34 },
        "245", { type: "number", value: 245 },
    ]);

    itMatches('numbers with +', [
        "+0", { type: "number", value: 0 },
        "+1", { type: "number", value: 1 },
        "+34", { type: "number", value: 34 },
        "+245", { type: "number", value: 245 },
    ]);

    itMatches('parses negative numbers', [
        "-0", { type: "number", value: 0 },
        "-1", { type: "number", value: -1 },
        "-34", { type: "number", value: -34 },
        "-245", { type: "number", value: -245 },
    ]);
})

describe('infix parsing', function() {
    itMatches('infix with spaces', [
        "0+1", {
            type: "binOp", op: BinOp.Plus,
            left: { type: "number", value: 0 }, right: { type: "number", value: 1 }
        },
        "0 + 1", {
            type: "binOp", op: BinOp.Plus,
            left: { type: "number", value: 0 }, right: { type: "number", value: 1 }
        },
        "0\t+ \n1\n", {
            type: "binOp", op: BinOp.Plus,
            left: { type: "number", value: 0 }, right: { type: "number", value: 1 }
        },
        "12*1", {
            type: "binOp", op: BinOp.Times,
            left: { type: "number", value: 12 }, right: { type: "number", value: 1 }
        },
        "678 * 1234", {
            type: "binOp", op: BinOp.Times,
            left: { type: "number", value: 678 }, right: { type: "number", value: 1234 }
        },
    ]);
    itMatches('infix +- with prefix exprs', [
        "0 + -1", {
            type: "binOp", op: BinOp.Plus,
            left: { type: "number", value: 0 },
            right: { type: "number", value: -1 }
        },
        "0 + +1", {
            type: "binOp", op: BinOp.Plus,
            left: { type: "number", value: 0 },
            right: { type: "number", value: 1 }
        },
        "0 - +1", {
            type: "binOp", op: BinOp.Minus,
            left: { type: "number", value: 0 },
            right: { type: "number", value: 1 }
        },
        "-0 + 1", {
            type: "binOp", op: BinOp.Plus,
            left: { type: "number", value: 0 },
            right: { type: "number", value: 1 }
        },
    ]);

    property(
        'can parse any input text',
        exprGen.text(),
        text => {
            const p = new Parser(text);
            p.expression();
        }
    );

    property('will parse expressions',
        exprGen.expression(10),
        expr => {
            const text = texty(expr);
            const found = new Parser(text).expression();
            expect(found).toEqual(expr);
        }
    );
});
