
/** Token type which can be tokenized by a Tokenizer. */
export type Token =
| { type: "done" }
| { type: "symbol", value: string }
| { type: "number", value: number }

/** Binary operator = `+`, `-`, `*`, etc. */
export enum BinOp {
    Plus = "+",
    Minus = "-",
    Times = "*",
    Divide = "/",
}

/** get the BinOp for the given symbol. */
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

/** An AST for expressions written in a NumericInput */
export type Expression =
    | { type: "number", value: number }
    | { type: "binOp", op: BinOp, left: Expression, right: Expression }
    | { type: "unaryOp", op: UnaryOp, expr: Expression }
    ;

/** Input that a user would use to roll dice. */
export type Program = {
    expr: Expression,
    pushLimit: bool,
}
