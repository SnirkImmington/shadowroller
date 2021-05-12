import { lispy, Parser, Expression } from '.';

function parseText(text: string): Expression {
    const parser = new Parser(text);
    const expression = parser.expression();
    if (!expression) {
        throw new Error(`Unable to parse "${expression}"`);
    }
    return expression;
}

function describeCases(title: string, cases: string[]) {
    describe(`${title}`, function() {
        for (let i = 0; i < cases.length; i += 2) {
            let input = cases[i];
            let output = cases[i+1];
            it(`lispy("${input}") = "${output}"`,
               () => expect(lispy(parseText(input))).toEqual(output)
            );
        }
    });
}

describeCases('Numbers', [
    "0", "0",
    "220", "220",
    ".23", "0.23",
    "1.43", "1.43",
]);

describeCases('Unary ops', [
    "-1.43", "-1.43",
    "+1.43", "1.43",
]);

describeCases('Binary ops', [
    "0 + 1", "(+ 0 1)",
    "220 - 1", "(- 220 1)",
    ".23 - 1 - 1", "(- (- 0.23 1) 1)",
]);
