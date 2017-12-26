// @flow
import type { Expression, BindingPower, MinPower } from '.';
import { powerOf } from '.';
import type { Token } from './tokenize';
import Tokenizer from './tokenize';

// eslint-disable-next-line no-use-before-define
type PrefixParser = (parser: Parser, current: Token) => ?Expression;

const PREFIX_PARSERS: { [string]: PrefixParser } = {
    // eslint-disable-next-line no-use-before-define
    '(': (parser: Parser, current: Token) => {
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
    // eslint-disable-next-line no-use-before-define
    '-': (parser: Parser, current: Token) => {
        const inner = parser.expression();
        if (inner == null) { return null; }
        return { type: "unaryOp", op: "-", expr: inner };
    },
    // eslint-disable-next-line no-use-before-define
    '+': (parser: Parser, current: Token) => {
        const inner = parser.expression();
        if (inner == null) { return null; }
        return { type: "unaryOp", op: "+", expr: inner };
    }
};

function isInfixChar(char: string): boolean {
    switch (char) {
        case '+': case '-':
        case '*': case '/':
        case '^':
        case '(': // We can parse `(` infix as multiplication.
            return true;
        default:
            return false;
    }
}

// eslint-disable-next-line no-use-before-define
function parseInfix(parser: Parser, left: Expression, symbol: string): ?Expression {
    switch (symbol) {
        // Treat an infix left paren as a multiplication expression.
        case '(': {
            const inner = parser.expression();
            if (inner == null) { return null; }
            const close = parser.token();
            if (close == null || close.type !== "symbol" || close.value !== ')') {
                return null;
            }
            return { type: "binOp", op: "*", left, right: inner };
        }
        case '+': case '-': case '*': case '/': {
            const power = powerOf(symbol);
            const right = parser.expression(power);
            if (right == null) { return null; }
            return { type: "binOp", op: symbol, left, right: right };
        }
        case '^': {
            const power = powerOf(symbol);
            const right = parser.expression(power);
            if (right == null) { return null; }
            return { type: "binOp", op: '^', left, right: right };
        }
        default:
            return null;
    }
}

export class Parser {
    tokenizer: Tokenizer;
    lookahead: ?Token;

    constructor(text: string) {
        this.tokenizer = new Tokenizer(text);
        this.lookahead = null;
    }

    peek = (): ?Token => {
        if (this.lookahead == null) {
            const next = this.tokenizer.next();
            if (next == null) { return null; }
            this.lookahead = next;
        }
        return this.lookahead;
    }

    token = (): ?Token => {
        if (this.lookahead == null) {
            return this.tokenizer.next();
        }
        else {
            const next = this.lookahead;
            this.lookahead = null;
            return next;
        }
    }

    expression = (power: BindingPower = 0): ?Expression => {
        let current = this.token();
        // If we're asking for an expression when we're done, we have a problem.
        if (current == null || current.type === 'done') {
            return null;
        }
        let left: Expression;
        // If we got a number, return a number.
        if (current.type === 'number') {
            left =  { type: 'number', value: current.value };
        }
        else {
            // Otherwise, look up the prefix parser we need.
            const prefixParser = PREFIX_PARSERS[current.value];
            if (prefixParser == null) {
                return null;
            }
            // Grab the prefix expression. If null, we have a problem.
            const parsedLeft = prefixParser(this, current);
            if (parsedLeft == null) { return null; }
            left = parsedLeft;
        }
        while (power <= this.currentPower()) {
            // We might have an infix char after this prefix expr.
            const infixToken = this.peek();
            // If we've reached the end, then it was just that expression we parsed.
            if (infixToken == null || infixToken.type === 'done') { return left; }
            // If we can't get a token now, we have a problem.
            else if (infixToken.type === 'number') { return null; }
            // If it's not an infix char, don't use it.
            if (!isInfixChar(infixToken.value)) {
                break;
            }
            // Confirm taking the token.
            this.token();
            const parsed = parseInfix(this, left, infixToken.value);
            if (parsed == null) { return null; }
            left = parsed;
        }
        return left;
    }

    currentPower = (): BindingPower => {
        const nextToken = this.peek();
        if (nextToken == null ||
            nextToken.type !== 'symbol') {
            return (0: MinPower);
        }
        else {
            return powerOf(nextToken.value);
        }
    }

    position = (): number => {
        return this.tokenizer.position;
    }
}
