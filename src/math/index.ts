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

export const MinPower = 0;
export const NegatePower = 1;
export const AddSubPower = 2;
export const MulDivPower = 3;
export const ExpPower = 4;
export const ParensPower = 5;

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
            return prefix ? NegatePower.valueOf : AddSubPower;
        case '*': case '/':
            return MulDivPower;
        case '^':
            return ExpPower;
        case '(': case ')':
            return ParensPower;
        default:
            return MinPower;
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
export { Tokenizer } from './tokenize';
