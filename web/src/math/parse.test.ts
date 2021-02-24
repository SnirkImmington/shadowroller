import { Parser, Expression, lispy } from '.';

function parseText(text: string): Expression {
    const parser = new Parser(text);
    const expression = parser.expression();
    if (!expression) {
        throw new Error(`Unable to parse expression "${text}"`);
    }
    return expression;
}

type Case = { in: string, out: Expression, name?: string};

function describeCases(title: string, cases: Case[]) {
    for (const { in: input, out, name } of cases) {
        it(`${title}: ${name ?? input}`, () =>
            expect(lispy(parseText(input))).toEqual(lispy(out))
        );
    }
}
describeCases('parses positive numbers', [
    { in: "0", out: { type: "number", value: 0 } },
    { in: "1", out: { type: "number", value: 1 } },
    { in: "34", out: { type: "number", value: 34 } },
    { in: "245", out: { type: "number", value: 245 } },
]);

describeCases('parses infix with spaces', [
    { in: "0+1", out: { type: "binOp", op: "+",
        left: { type: "number", value: 0 }, right: { type: "number", value: 1 }}},
    { in: "0 + 1", out: { type: "binOp", op: "+",
        left: { type: "number", value: 0 }, right: { type: "number", value: 1 }}},
    { in: "0\t+ \n1\n", out: { type: "binOp", op: "+",
        left: { type: "number", value: 0 }, right: { type: "number", value: 1 }}},
]);

describeCases('parses prefix +-', [
    { in: "-1", out: { type: "unaryOp", op: "-", expr: { type: "number", value: 1 }}},
    { in: "+1", out: { type: "unaryOp", op: "+", expr: { type: "number", value: 1 }}},
    { in: "-1", out: { type: "unaryOp", op: "-", expr: { type: "number", value: 1 }}},
]);

describeCases('parses infix +- with prefix exprs', [
    { in: "0 + -1", out: { type: "binOp", op: "+",
        left: { type: "number", value: 0 },
        right: { type: "unaryOp", op: "-", expr: { type: "number", value: 1 }}}},
    { in: "0 + +1", out: { type: "binOp", op: "+",
        left: { type: "number", value: 0 },
        right: { type: "unaryOp", op: "+", expr: { type: "number", value: 1 }}}},
    { in: "0 - +1", out: { type: "binOp", op: "-",
        left: { type: "number", value: 0 },
        right: { type: "unaryOp", op: "+", expr: { type: "number", value: 1 }}}},
    { in: "-0 + 1", out: { type: "binOp", op: "+",
        left: { type: "unaryOp", op: "+", expr: { type: "number", value: 0 }},
        right: { type: "number", value: 1 }}},
]);
