import * as React from 'react';

/** Setter is the type of the `setState` function from `React.useState`. */
export type SetterBase<T, S extends T> = (val: T | ((prev: S) => T)) => void;
export type Setter<T> = (val: T | ((prev: T) => T)) => void;

/** Json is the type of JSON-encodable data. */
export type Json =
| null
| undefined // Can be sent to parser and back. Allows for types with undefined fields.
| boolean
| number
| string
| {}
| { [property: string]: Json } // Interestingly, TS complains if you do Record<string, Json> here
| Json[]


/** pluralize(count, text) pluralizes a noun to count in English by adding
    "s" or "es" if count > 1. */
export function pluralize(count: number, text: string): string {
    if (count === 1) {
        return text;
    }
    else if (text.endsWith("s")) {
        return text + "es";
    }
    else {
        return text + 's';
    }
}

/** pickRandom(items) picks a random member of items. */
export function pickRandom<T>(items: Array<T>): T {
    return items[Math.floor(Math.random() * items.length)];
}

/** useFlavor(options) wraps React.useState() by providing a shuffle() function
    instead of a setState(value) function. */
export function useFlavor<T>(options: T[]): [T, () => void] {
    const [flavor, setFlavor] = React.useState(() => pickRandom(options));
    return [flavor, () => setFlavor(() => pickRandom(options))];
}

/** useToggle(initial) wraps react.useState<boolean>() by providing a toggle()
    function instead of a setState(value) function. */
export function useToggle(initial: boolean | (() => boolean)): [boolean, () => void, Setter<boolean>] {
    const [value, setValue] = React.useState<boolean>(initial);
    const toggle = React.useCallback(() => setValue(v => !v), [setValue]);
    return [value, toggle, setValue];
}

/** TaskState is the state of a current task (promise). */
export type TaskState<T> =
| { state: "pending" }
| { state: "resolved", value: T }
| { state: "rejected", error: Error };

/** useTask attaches a then() to the given promise, and returns a state variable
    for the promise's progress. It accepts an optional timeout at which to reject
    the given promise as well. */
export function useTask<T>(promise: Promise<T>, timeout?: number): TaskState<T> {
    const [state, setState] = React.useState<TaskState<T>>({ state: "pending" });
    React.useEffect(() => {
        promise.then(t => {
            setState({ state: "resolved", value: t });
            return t;
        });
        promise.catch(e => {
            setState({ state: "rejected", error: e });
            return e;
        });
        if (timeout) {
            let timer = setTimeout(function() {
                setState(s =>
                    s.state === "pending" ? {
                        state: "rejected", error: Error("operation timed out")
                    } : s);
            }, timeout);
            return () => clearTimeout(timer);
        }
    });
    return state;
}

/** Once holds the result of a function which is only evaluated once. */
type Once<T> = {
    /** call causes the once function to be called. */
    call(): void;
    /** ready reports whether the function has been called. */
    ready(): boolean;
    /** get retrieves the value, calling the function if needed. */
    get(): T;
};

/** once wraps a function with the ability to be called only once. */
export function once<T>(constructor: () => T): Once<T> {
    let state: T|undefined = undefined;
    return {
        call() {
            if (state === undefined) {
                state = constructor();
            }
        },
        ready(): boolean {
            return state !== undefined;
        },
        get(): T {
            if (state === undefined) {
                state = constructor();
            }
            return state;
        }
    }
}

/** ExtendedTaskState is a `TaskState<T>` which can also be delayed, which
    should be used to render a loading indicator to the UI. */
type ExtendedTaskState<T> =
| { state: "delayed" }
| TaskState<T>

/** useDelayTask wraps a promise into an `ExtendedTaskState` value, with a delay
    value which can be used to show a loading spinner if the task does not
    complete fast enough.
    It also accepts a timeout which will reject the promise. */
export function useDelayTask<T>(promise: Promise<T>, delay: number, timeout?: number): ExtendedTaskState<T> {
    const [state, setState] = React.useState<ExtendedTaskState<T>>({ state: "pending" });
    React.useEffect(() => {
        promise.then(t => {
            setState({ state: "resolved", value: t });
            return t;
        });
        promise.catch(e => {
            setState({ state: "rejected", error: e });
            return e;
        });
        if (timeout) {
            const timeoutTimer = setTimeout(function() {
                setState(s =>
                    s.state === "pending" ? {
                        state: "rejected", error: Error("operation timed out")
                    } : s);
            }, timeout);
            return () => clearTimeout(timeoutTimer);
        }
    });
    React.useEffect(() => {
        const delayTimer = setTimeout(function() {
            setState(s =>
                s.state === "pending" ? { state: "delayed" }
                : s
            );
        }, delay);
        return () => clearTimeout(delayTimer);
    })
    return state;
}

/** genRandomID() produces a random ID which matches server's `id.GenUID()`.
    It uses 6 bytes by default. */
export function genRandomID(): string {
    const bytes = [0, 0, 0, 0, 0, 0].map(_ => Math.floor(Math.random() * 256));
    const chars = bytes.map(b => String.fromCharCode(b));
    return btoa(chars.join(''));
}
