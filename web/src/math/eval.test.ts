import { Parser, evaluate } from '.';
import * as fcUtils from 'fc-utils.test';
import * as exprGen from './expression.gen';

function evalText(text: string): number {
    const parser = new Parser(text);
    const expression = parser.expression();
    if (!expression) {
        throw new Error(`Did not parse an expression from "${text}"`);
    }
    return evaluate(expression);
}

function describeCases(title: string, cases: (string|number)[]) {
    describe(`${title}`, function() {
        for (let i = 0; i < cases.length; i += 2) {
            let input = cases[i] as string;
            let output = cases[i + 1] as number;
            it(`eval("${input}") = ${output}`,
               () => expect(evalText(input)).toBe(output));
        }
    });
}

describeCases('Whole numbers', [
    "0", 0,
    "1", 1,
    "2", 2,
    "32", 32,
    "34456", 34456,
    "1234567890", 1234567890,
    "666", 666,
    "-0", 0,
    "-122", -122,
    "-33256", -33256,
]);

describeCases('Decimals', [
    "0.0", 0,
    "1.0000", 1,
    "0.2", 0.2,
    "3.2", 3.2,
    "34.456", 34.456,
    ".1234567890", 0.1234567890,
    "-1.22", -1.22,
    "-.33256", -0.33256,
]);

describeCases('Addition and subtraction', [
    "1+1", 2,
    "2+3", 5,
    "1+1+1+1", 4,
    "1+1-1+1-1", 1,
    "1  +    1", 2,
    "1 +1", 2,
    "1 -1", 0,
    "1-1", 0,
    "-1 + 1", 0,
    "-1 +1", 0,
    "-1 - -1", 0,
    "-2--2", 0,
    "-1 + -1", -2,
    "-2+-2", -4
]);

describeCases('Multiplication and division', [
    "1*1", 1,
    "2*3", 6,
    "2*2*2*2", 16,
    "2*2/2*2/2", 2,
    "2  *    2", 4,
    "1 *1", 1,
    "1 *0", 0,
    "-1 * 1", -1,
    "-1 *1", -1,
    "-1 * -1", 1,
    "-2*-2", 4,
    "-1 / -1", 1,
    "-2/-2", 1,
]);

describeCases('Pemdas handling', [
    "1 + 3 * 2", 7,
    "3 * 2 + 1", 7,
    "3 + 2 * 1", 5,
    "2 * 1 + 3", 5,
    "1 * 3 + 1 * 3", 6,
]);

describe('fast-check', function() {
    fcUtils.property(
        'does not evalutate to NaN',
        exprGen.expression(),
        e => !isNaN(evaluate(e))
    );
});
