import * as React from 'react';
import { ThemeProvider } from 'styled-components/macro';
import * as theme from 'theme';

import * as Game from 'game';
import * as Event from 'event';
import * as Player from 'player';
import StreamProvider from 'sseStream/Provider';
import { ConnectionCtx, SetConnectionCtx, RetryConnection } from 'connection';

import Shadowroller from 'Shadowroller';

import 'assets-external/source-code-pro.css';

export default function App(_props: {}) {
    const [game, gameDispatch] = React.useReducer(Game.reduce, Game.defaultState);
    const [player, playerDispatch] = React.useReducer(Player.reduce, Player.defaultState);
    const [eventList, eventDispatch] = React.useReducer(Event.reduce, Event.defaultState);
    const [connection, setConnection] = React.useState<RetryConnection>("offline");
    const [themeMode, setThemeMode] = React.useState<theme.Mode>(theme.defaultMode);
    const appliedTheme = {
        ...theme.default,
        colors: themeMode === "light" ? theme.default.light : theme.default.dark
    };

    return (
        <ThemeProvider theme={appliedTheme}>
        <theme.Ctx.Provider value={themeMode}>
        <theme.DispatchCtx.Provider value={setThemeMode}>
        <ConnectionCtx.Provider value={connection}>
        <SetConnectionCtx.Provider value={setConnection}>
        <Game.Ctx.Provider value={game}>
        <Game.DispatchCtx.Provider value={gameDispatch}>
        <Player.Ctx.Provider value={player}>
        <Player.DispatchCtx.Provider value={playerDispatch}>
        <Event.Ctx.Provider value={eventList}>
        <Event.DispatchCtx.Provider value={eventDispatch}>
        <StreamProvider>

            <Shadowroller />

        </StreamProvider>
        </Event.DispatchCtx.Provider>
        </Event.Ctx.Provider>
        </Player.DispatchCtx.Provider>
        </Player.Ctx.Provider>
        </Game.DispatchCtx.Provider>
        </Game.Ctx.Provider>
        </SetConnectionCtx.Provider>
        </ConnectionCtx.Provider>
        </theme.DispatchCtx.Provider>
        </theme.Ctx.Provider>
        </ThemeProvider>
    );
}
