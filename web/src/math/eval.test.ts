import { Parser, evaluate } from '.';

function evalText(text: string): number {
    const parser = new Parser(text);
    const expression = parser.expression();
    if (!expression) {
        throw new Error(`Did not parse an expression from "${text}"`);
    }
    return evaluate(expression);
}

type Case = { in: string, out: number, name?: string};

function describeCases(title: string, cases: Case[]) {
    for (const { in: input, out, name } of cases) {
        it(`${title}: ${name ?? input}`, () =>
            expect(evalText(input)).toBe(out)
        );
    }
}

it('Evaluates -0', () => {
    expect(evalText("-0")).toBe(0);
});

describeCases('Evaluates whole numbers', [
    { in: "0", out: 0 },
    { in: "1", out: 1 },
    { in: "2", out: 2 },
    { in: "32", out: 32 },
    { in: "34456", out: 34456 },
    { in: "1234567890", out: 1234567890 },
    { in: "666", out: 666 },
    { in: "-122", out: -122 },
    { in: "-33256", out: -33256 },
]);

describeCases('Evaluates basic decimals', [
    { in: "0.0", out: 0 },
    { in: "1.0000", out: 1 },
    { in: "0.2", out: 0.2 },
    { in: "3.2", out: 3.2 },
    { in: "34.456", out: 34.456 },
    { in: ".1234567890", out: 0.1234567890 },
    { in: "-1.22", out: -1.22 },
    { in: "-.33256", out: -0.33256 },
]);

describeCases('Evaluates add expressions', [
    { in: "1+1", out: 2 },
    { in: "2+3", out: 5 },
    { in: "1+1+1+1", out: 4 },
    { in: "1+1-1+1-1", out: 1 },
    { in: "1  +    1", out: 2 },
    { in: "1 +1", out: 2 },
    { in: "1 -1", out: 0 },
    { in: "1-1", out: 0 },
    { in: "-1 + 1", out: 0},
    { in: "-1 +1", out: 0 },
    { in: "-1 - -1", out: 0 },
    { in: "-2--2", out: 0 },
    { in: "-1 + -1", out: -2 },
    { in: "-2+-2", out: -4 }
]);

describeCases('Evaluates multiplication expressions', [
    { in: "1*1", out: 1 },
    { in: "2*3", out: 6 },
    { in: "2*2*2*2", out: 16 },
    { in: "2*2/2*2/2", out: 2 },
    { in: "2  *    2", out: 4 },
    { in: "1 *1", out: 1 },
    { in: "1 *0", out: 0 },
    { in: "-1 * 1", out: -1 },
    { in: "-1 *1", out: -1 },
    { in: "-1 * -1", out: 1 },
    { in: "-2*-2", out: 4 },
    { in: "-1 / -1", out: 1 },
    { in: "-2/-2", out: 1 }
]);
