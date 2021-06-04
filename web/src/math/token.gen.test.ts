import { Token } from './tokenize';
import * as fc from 'fast-check';

export function done(): fc.Arbitrary<Token> {
    return fc.constant({ type: "done" });
}

export function symbol(): fc.Arbitrary<Token> {
    return fc.integer({ min: 1, max: 6 }).map(i => {
        switch (i) {
            case 1: return '(';
            case 2: return ')';
            case 3: return '+';
            case 4: return '-';
            case 5: return '*';
            case 6: return '/';
            default: throw Error("Bad filter");
        }
    }).map(c => ({ type: "symbol", value: c }));
}

export function number(): fc.Arbitrary<Token> {
    return fc.integer({ min: 0 }).map(i => (
        { type: "number", value: i }
    ));
}

export function notDoneToken(): fc.Arbitrary<Token> {
    return fc.integer({ min: 1, max: 2 }).chain(i => {
        switch (i) {
            case 1: return symbol();
            case 2: return number();
            default: throw Error("Bad filter");
        }
    });
}

export function tokenStream(): fc.Arbitrary<Token[]> {
    return fc.array(notDoneToken()).map(s => [...s, { type: "done" }]);
}

export function token(): fc.Arbitrary<Token> {
    return fc.integer({ min: 1, max: 3 }).chain(i => {
        switch (i) {
            case 1: return done();
            case 2: return symbol();
            case 3: return number();
            default: throw Error("Bad filter");
        }
    });
}
