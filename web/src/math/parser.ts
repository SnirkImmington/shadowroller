import { Expression, BindingPower, UnaryOp, BinOp, binOpOf } from '.';
import { powerOf, Tokenizer } from 'math';
import type { Token } from 'math/tokenize';

/** Parse expressions and input programs. */
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
