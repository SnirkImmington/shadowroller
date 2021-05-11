import { Expression, BindingPower, UnaryOp, BinOp, binOpOf } from '.';
import { powerOf, Tokenizer } from 'math';
import type { Token } from 'math/tokenize';

/** A parser which parses prefix expression */
type PrefixParser = (parser: Parser, current: Token) => Expression|null ;

/** Available parsers for prefix expression: '(', '-', '+' */
const PREFIX_PARSERS: Record<string, PrefixParser> = {
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

/** Whether the given character is used for an infix expression */
function isInfixChar(char: string): boolean {
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
function parseInfix(parser: Parser, left: Expression, symbol: string): Expression|null {
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

export class Parser {
    tokenizer: Tokenizer;
    lookahead: Token|null;

    constructor(text: string) {
        this.tokenizer = new Tokenizer(text);
        this.lookahead = null;
    }

    peek = (): Token|null => {
        if (this.lookahead == null) {
            const next = this.tokenizer.next();
            if (next == null) { return null; }
            this.lookahead = next;
        }
        return this.lookahead;
    }

    token = (): Token|null => {
        if (this.lookahead == null) {
            return this.tokenizer.next();
        }
        else {
            const next = this.lookahead;
            this.lookahead = null;
            return next;
        }
    }

    expression = (power?: BindingPower): Expression|null => {
        power = power ?? BindingPower.Min;
        let current = this.token();
        // If we're asking for an expression when we're done, we have a problem.
        if (current == null || current.type === 'done') {
            return null;
        }
        let left: Expression;
        // If we got a number, return a number; don't need to parse.
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
        while (power < this.nextTokenPower()) {
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

    nextTokenPower = (): BindingPower => {
        const nextToken = this.peek();
        if (nextToken == null || nextToken.type === "done") {
            return BindingPower.Min;
        }
        else {
            return powerOf(nextToken.value, false);
        }
    }

    position = (): number => {
        return this.tokenizer.position;
    }
}
