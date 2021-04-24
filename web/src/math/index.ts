/** Binary operator = `+`, `-`, `*`, etc. */
export enum BinOp {
    Plus = "+",
    Minus = "-",
    Times = "*",
    Divide = "/",
}

export function binOpOf(symbol: string): BinOp {
    switch (symbol) {
        case "+": return BinOp.Plus;
        case "-": return BinOp.Minus;
        case "*": return BinOp.Times;
        case "/": return BinOp.Divide;
        default:
            throw new Error("Attempted to get an invalid binOp")
    }
}

/** Unary operator = negative and (no-op) positive */
export enum UnaryOp {
    /** -(expression) */
    Negate = "-",
    /** Technically a no-op */
    Positive = "+",
}

/** Whether to round up or down. */
export enum Round {
    Up = "up",
    Down = "down",
}

/** An AST for expressions written in a NumericInput */
export type Expression =
| { type: "number", value: number }
| { type: "binOp", op: BinOp, left: Expression, right: Expression }
| { type: "unaryOp", op: UnaryOp, expr: Expression }
;

/** The precedence of an expression or operator in pemdas */
export enum BindingPower {
    Min = 0,
    Negate = 1,
    AddSub = 2,
    MulDiv = 3,
    Parens = 4,
}

export const CALCULATOR_CHAR = "🖩";

/** The binding power of a given symbol (optionally in prefix/unary op position) */
export function powerOf(symbol: string | number, prefix: boolean): BindingPower {
    if (typeof symbol === "number") {
        return BindingPower.Number;
    }
    switch (symbol) {
        case '+':
        case '-':
            return prefix ? BindingPower.Negate : BindingPower.AddSub;
        case '*':
        case '/':
            return BindingPower.MulDiv;
        case '(':
        case ')':
            return BindingPower.Parens;
        default:
            return BindingPower.Min;
    }
}

/** Exports the function as an S-expression. Uses square brackets for unary ops. */
export function lispy(expr: Expression): string {
    switch (expr.type) {
        case "number":
            return expr.value.toString();
        case "unaryOp":
            return `[${expr.op} ${lispy(expr.expr)}]`;
        case "binOp":
            return `(${expr.op} ${lispy(expr.left)} ${lispy(expr.right)})`;
        default:
            return `!!!`;
    }
}

/** Evaluates the given expression. */
export function evaluate(expr: Expression): number {
    switch (expr.type) {
        case 'number':
            return expr.value;
        case 'unaryOp':
            switch (expr.op) {
                case UnaryOp.Positive:
                    return evaluate(expr.expr);
                case UnaryOp.Negate:
                    return -1 * evaluate(expr.expr);
                default:
                    return NaN;
            }
        case 'binOp':
            switch (expr.op) {
                case BinOp.Plus:
                    return evaluate(expr.left) + evaluate(expr.right);
                case BinOp.Minus:
                    return evaluate(expr.left) - evaluate(expr.right);
                case BinOp.Times:
                    return evaluate(expr.left) * evaluate(expr.right);
                case BinOp.Divide:
                    return evaluate(expr.left) / evaluate(expr.right);
                default:
                    return NaN;
            }
        default:
            return NaN;
    }
}

export {  Parser } from './parse';
export { Tokenizer } from './tokenize';
