// @flow

import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';

import * as Game from 'game';
import * as Event from 'event';
import * as server from 'server';
import { ConnectionCtx, SetConnectionCtx } from 'connection';
import type { Connection } from 'connection';

import SRHeader from 'header';
import RollDicePrompt from 'roll-dice';
import EventHistory from 'event/history-panel';
import DebugBar from 'debug-bar';

const AppLeft: StyledComponent<> = styled.div`
    /* Phones: vertical margin included in cards. */

    padding-left: 0.5em;

    /* Tablet+: roll history on right. */
    @media all and (min-width: 768px) {
        flex-grow: 1; /* Grows out */
        padding-right: 14px;
    }
`;

const AppRight: StyledComponent<> = styled.div`
    /* Phones: no padding needed. */
    height: 100%; /* Always go as high as possible. */

    padding-left: 2px;

    @media all and (min-width: 768px) {
        width: 37rem;
    }
`;

function Shadowroller() {
    const connection = React.useContext(ConnectionCtx);
    const [menuShown, setMenuShown] = React.useState<bool>(false);

    function onGameButtonClick() { setMenuShown((prev) => !prev); }

    let menu: React.Node = '';
    if (menuShown) {
        menu = connection !== "connected" ?
            <Game.JoinMenu hide={() => setMenuShown(false)} />
            : <Game.StatusMenu />;
    }

    return (
        <ThemeProvider theme={theme}>
            {process.env.NODE_ENV !== "production" &&
                <DebugBar />
            }

            <SRHeader menuShown={menuShown}
                      onClick={onGameButtonClick} />
            { menu }
            <UI.ColumnToRow grow>
                <AppLeft>
                    <RollDicePrompt />
                </AppLeft>
                <AppRight>
                    <EventHistory />
                </AppRight>
            </UI.ColumnToRow>
        </ThemeProvider>
    );
}

export default function App(props: {}) {
    const [game, gameDispatch] = React.useReducer(Game.reduce, Game.defaultState);
    const [eventList, eventDispatch] = React.useReducer(Event.reduce, Event.defaultState);
    const [connection, setConnection] = React.useState<Connection>("offline");

    React.useEffect(
        () => server.initialCookieCheck(gameDispatch, eventDispatch, setConnection), []);


    // Page should be a flexbox.
    return (
        <ConnectionCtx.Provider value={connection}>
        <SetConnectionCtx.Provider value={setConnection}>
        <Game.Ctx.Provider value={game}>
        <Event.Ctx.Provider value={eventList}>
        <Game.DispatchCtx.Provider value={gameDispatch}>
        <Event.DispatchCtx.Provider value={eventDispatch}>

            <Shadowroller />

        </Event.DispatchCtx.Provider>
        </Game.DispatchCtx.Provider>
        </Event.Ctx.Provider>
        </Game.Ctx.Provider>
        </SetConnectionCtx.Provider>
        </ConnectionCtx.Provider>
    );
}
