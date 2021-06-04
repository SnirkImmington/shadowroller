import { UnaryOp, BinOp, Expression, Round, lispy } from '.';
import * as fc from 'fast-check';

export function round(): fc.Arbitrary<Round> {
    return fc.boolean().map((b: boolean) =>
        b ? Round.Up : Round.Down
    );
}

export function binOp(): fc.Arbitrary<BinOp> {
    return fc.integer({ min: 1, max: 4})
        .map((i: number) => {
            switch (i) {
                case 1: return BinOp.Plus;
                case 2: return BinOp.Minus;
                case 3: return BinOp.Times;
                case 4: return BinOp.Divide;
                default: throw Error("Bad filter");
            }
        });
}

export function unaryOp(): fc.Arbitrary<UnaryOp> {
    return fc.boolean().map((b: boolean) =>
        b ? UnaryOp.Positive : UnaryOp.Negate
    );
}

export function numberExpression(): fc.Arbitrary<Expression> {
    return fc.integer().map((i: number) => (
        { type: "number", value: i }
    ));
}

export function binOpExpression(): fc.Arbitrary<Expression> {
    const op = binOp();
    const left = expression();
    const right = expression();
    return fc.record({ op, left, right }).map(r => ({ ...r, type: "binOp"}))
}

export function unaryOpExpression(): fc.Arbitrary<Expression> {
    const op = unaryOp();
    const expr = expression();
    return fc.record({ op, expr }).map(r => ({ ...r, type: "unaryOp" }));
}

export function expression(): fc.Arbitrary<Expression> {
    return fc.integer({ min: 1, max: 3}).chain((i) => {
        switch (i) {
            case 1: return numberExpression();
            case 2: return binOpExpression();
            case 3: return unaryOpExpression();
            default: throw Error("Bad filter");
        }
    });
}
