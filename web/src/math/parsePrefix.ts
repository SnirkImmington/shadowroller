import type { Token } from 'math/tokenize';
import type { Parser as ExprParser } from 'math/parseExpr.ts'

/** A parser which parses prefix expression */
export type Parser = (parser: Parser, current: Token) => Expression|null ;

/** Available parsers for prefix expression: '(', '-', '+' */
export const PREFIX_PARSERS: Record<string, PrefixParser> = {
    '(': (parser: Parser, _current: Token) => {
        // Grab expression within parens.
        const inner = parser.expression();
        if (inner == null) { return null };
        const ending = parser.token();
        // Expect a `)` after an expression.
        if (ending == null || ending.type !== 'symbol') {
            return null;
        }
        else if (ending.value !== ')') {
            return null;
        }
        return inner;
    },
    '-': (parser: Parser, _current: Token) => {
        let peeked = parser.peek();
        if (peeked != null && peeked.type === "number") {
            parser.token(); // Move to the next token, use peeked
            return { type: "number", value: peeked.value === 0 ? 0 : -peeked.value };
        }
        const inner = parser.expression(BindingPower.Max);
        if (inner == null) { return null; }
        return { type: "unaryOp", op: UnaryOp.Negate, expr: inner };
    },
    '+': (parser: Parser, _current: Token) => {
        let peeked = parser.peek();
        if (peeked != null && peeked.type === "number") {
            parser.token();
            return { type: "number", value: peeked.value };
        }
        const inner = parser.expression(BindingPower.Max);
        if (inner == null) { return null; }
        return { type: "unaryOp", op: UnaryOp.Positive, expr: inner };
    }
};
