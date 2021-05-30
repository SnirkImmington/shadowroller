import { Expression, BindingPower, UnaryOp, BinOp, binOpOf } from '.';
import { powerOf, Tokenizer } from 'math';
import type { Token } from 'math/tokenize';

/** Whether the given character is used for an infix expression */
export function isInfixChar(char: string): boolean {
    switch (char) {
        case '+': case '-':
        case '*': case '/':
        case '(': // We can parse `(` infix as multiplication.
            return true;
        default:
            return false;
    }
}

/** Parse an infix expression after having parsed the LHS. */
export function parseInfix(parser: Parser, left: Expression, symbol: string): Expression|null {
    switch (symbol) {
        // Treat an infix left paren as a multiplication expression.
        case '(': {
            const inner = parser.expression();
            if (inner == null) { return null; }
            const close = parser.token();
            if (close == null || close.type !== "symbol" || close.value !== ')') {
                return null;
            }
            return { type: "binOp", op: BinOp.Times, left, right: inner };
        }
        case '+': case '-': case '*': case '/': {
            const power = powerOf(symbol, false);
            const right = parser.expression(power);
            if (right == null) { return null; }
            return { type: "binOp", op: binOpOf(symbol), left, right: right };
        }
        default:
            return null;
    }
}
