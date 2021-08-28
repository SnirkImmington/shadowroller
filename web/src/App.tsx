import * as React from 'react';
import { ThemeProvider } from 'styled-components/macro';
import * as theme from 'theme';

import * as Game from 'game';
import * as Event from 'event';
import * as Player from 'player';
import StreamProvider from 'sseStream/Provider';
import { ConnectionCtx, SetConnectionCtx } from 'connection';
import * as srutil from 'srutil';

import Shadowroller from 'Shadowroller';

import 'assets-external/source-code-pro.css';

type ReducerProviderProps<S, A> = {
    reduce: React.Reducer<S, A>,
    defaultState: S,
    stateCtx: React.Context<S>,
    dispatchCtx: React.Context<React.Dispatch<A>>,
}

function ReducerProvider<S, A>(props: React.PropsWithChildren<ReducerProviderProps<S, A>>) {
    const { reduce, defaultState, stateCtx, dispatchCtx } = props;
    const [state, stateDispatch] = React.useReducer(reduce, defaultState);

    return (
        <stateCtx.Provider value={state}>
        <dispatchCtx.Provider value={stateDispatch}>
            {props.children}
        </dispatchCtx.Provider>
        </stateCtx.Provider>
    );
}

type StateProviderProps<S> = {
    defaultState: S,
    stateCtx: React.Context<S>,
    setStateCtx: React.Context<srutil.Setter<S>>,
}

function StateProvider<S>(props: React.PropsWithChildren<StateProviderProps<S>>) {
    const { defaultState, stateCtx, setStateCtx } = props;
    const [state, setState] = React.useState<S>(defaultState);

    return (
        <stateCtx.Provider value={state}>
        <setStateCtx.Provider value={setState}>
            {props.children}
        </setStateCtx.Provider>
        </stateCtx.Provider>
    );
}

export default function App(_props: {}) {
    const [themeMode, setThemeMode] = React.useState<theme.Mode>(theme.defaultMode);
    const appliedTheme = {
        ...theme.default,
        colors: themeMode === "light" ? theme.default.light : theme.default.dark
    };

    return (
        <ThemeProvider theme={appliedTheme}>
        <theme.Ctx.Provider value={themeMode}>
        <theme.DispatchCtx.Provider value={setThemeMode}>
        <StateProvider defaultState="offline"
                       stateCtx={ConnectionCtx} setStateCtx={SetConnectionCtx}>
        <ReducerProvider defaultState={Game.defaultState} reduce={Game.reduce}
                         stateCtx={Game.Ctx} dispatchCtx={Game.DispatchCtx}>
        <ReducerProvider defaultState={Player.defaultState} reduce={Player.reduce}
                         stateCtx={Player.Ctx} dispatchCtx={Player.DispatchCtx}>
        <ReducerProvider defaultState={Event.defaultState} reduce={Event.reduce}
                         stateCtx={Event.Ctx} dispatchCtx={Event.DispatchCtx}>
        <StreamProvider>

            <Shadowroller />

        </StreamProvider>
        </ReducerProvider>
        </ReducerProvider>
        </ReducerProvider>
        </StateProvider>
        </theme.DispatchCtx.Provider>
        </theme.Ctx.Provider>
        </ThemeProvider>
    );
}
