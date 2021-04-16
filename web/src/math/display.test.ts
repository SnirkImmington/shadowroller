import { lispy, Parser, Expression } from '.';

function parseText(text: string): Expression {
    const parser = new Parser(text);
    return parser.expression();
}

type Case = { in: string, out: string, name?: string};

function describeCases(title: string, cases: Case[]) {
    for (const { in: input, out, name } of cases) {
        it(`${title}: ${name ?? input}`, () =>
            expect(lispy(parseText(input))).toEqual(out)
        );
    }
}

describeCases('lispy numbers', [
    { in: "0", out: "0" },
    { in: "220", out: "220" },
    { in: ".23", out: "0.23" },
    { in: "1.43", out: "1.43" },
]);

describeCases('lispy unary ops', [
    { in: "-1.43", out: "[- 1.43]" },
    { in: "+1.43", out: "[+ 1.43]" },
]);

describeCases('lispy binary ops', [
    { in: "0 + 1", out: "(+ 0 1)" },
    { in: "220 - 1", out: "(- 220 1)" },
    { in: ".23 - 1 - 1", out: "(- (- .23 1) 1)" },
]);
