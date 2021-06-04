import { UnaryOp, BinOp, Expression, Round } from '.';
import * as fc from 'fast-check';

export function round(): fc.Arbitrary<Round> {
    return fc.boolean().map((b: boolean) =>
        b ? Round.Up : Round.Down
    );
}

export function binOp(): fc.Arbitrary<BinOp> {
    return fc.oneof(
        fc.constant(BinOp.Plus),
        fc.constant(BinOp.Minus),
        fc.constant(BinOp.Times),
        fc.constant(BinOp.Divide),
    );
}

export function unaryOp(): fc.Arbitrary<UnaryOp> {
    return fc.boolean().map((b: boolean) =>
        b ? UnaryOp.Positive : UnaryOp.Negate
    );
}

export function numberExpression(): fc.Arbitrary<Expression> {
    return fc.integer().filter(i => !isNaN(i) && i !== -0 && isFinite(i)).map((i: number) => (
        { type: "number", value: i }
    ));
}

export function binOpExpression(maxDepth: number): fc.Arbitrary<Expression> {
    const op = binOp();
    const left = expression(maxDepth - 1);
    const right = expression(maxDepth - 1);
    return fc.record({ op, left, right }).map(r => ({ ...r, type: "binOp"}))
}

export function unaryOpExpression(maxDepth: number): fc.Arbitrary<Expression> {
    const op = unaryOp();
    const expr = binOpExpression(maxDepth - 1);
    return fc.record({ op, expr }).map(r => ({ ...r, type: "unaryOp" }));
}

export function expression(maxDepth?: number): fc.Arbitrary<Expression> {
    return fc.memo<Expression>(n => {
        if (n <= 0) {
            return numberExpression();
        }
        return fc.oneof(
            numberExpression(),
            binOpExpression(n - 1),
            unaryOpExpression(n - 1), // These aren't parsed
        );
    })(maxDepth ?? 10);
}

export function text(): fc.Arbitrary<string> {
    return fc.array(
        fc.oneof(
            unaryOp(),
            binOp(),
            fc.integer().map(i => i.toString()),
            fc.char()
        )
    ).map(text => text.join(""));
}
