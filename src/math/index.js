// @flow

/** Binary operator, i.e. `+`, `-`, `*`, etc. */
export type BinOp =
| "+"
| "-"
| "*"
| "/"
| "^"
;

/** Unary operator: negative and positive */
export type UnaryOp =
| "-"
| "+"
;

/**  */
export type RoundingMode =
| "up"
| "down"
;

export type Expression =
| { type: "number", value: number }
| { type: "binOp", op: BinOp, left: Expression, right: Expression }
| { type: "unaryOp", op: UnaryOp, expr: Expression }
;

export type MinPower = 0;
export type NegatePower = 1;
export type AddSubPower = 2;
export type MulDivPower = 3;
export type ExpPower = 4;
export type ParensPower = 5;

export type BindingPower =
| MinPower
| NegatePower
| AddSubPower
| MulDivPower
| ExpPower
| ParensPower
;

export const CALCULATOR_CHAR = "🖩";

export function powerOf(symbol: string, prefix: boolean): BindingPower {
    switch (symbol) {
        case '+':
        case '-':
            return prefix ? (1: NegatePower) : (2: AddSubPower);
        case '*': case '/':
            return (3: MulDivPower);
        case '^':
            return (4: ExpPower);
        case '(': case ')':
            return (5: ParensPower);
        default:
            return (0: MinPower);
    }
}

export function evaluate(expr: Expression): number {
    switch (expr.type) {
        case 'number':
            return expr.value;
        case 'unaryOp':
            switch (expr.op) {
                case '+':
                    return evaluate(expr.expr);
                case '-':
                    return -1 * evaluate(expr.expr);
                default:
                    return NaN;
            }
        case 'binOp':
            switch (expr.op) {
                case '+':
                    return evaluate(expr.left) + evaluate(expr.right);
                case '-':
                    return evaluate(expr.left) - evaluate(expr.right);
                case '*':
                    return evaluate(expr.left) * evaluate(expr.right);
                case '/':
                    return evaluate(expr.left) / evaluate(expr.right);
                case '^':
                    return Math.pow(evaluate(expr.left), evaluate(expr.right));
                default:
                    return NaN;
            }
        default:
            return NaN;
    }
}

export {  Parser } from './parse';
