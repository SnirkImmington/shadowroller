// @flow

import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';

import * as Game from 'game';
import * as Event from 'event';

import SRHeader from 'header';
import RollDicePrompt from 'roll-dice';
import EventHistory from 'event/history-panel';
import DebugBar from 'debug-bar';

import * as server from 'server';

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
        width: 32em;
    }
`;

export default function App(props: {}) {
    const [game, gameDispatch] = React.useReducer(Game.reduce, Game.defaultState);
    const [eventList, eventDispatch] = React.useReducer(Event.reduce, Event.defaultState);
    const [connection, setConnection] = React.useState<server.Connection>("offline");

    React.useEffect(
        () => server.initialCookieCheck(gameDispatch, eventDispatch, setConnection), []);

    const [menuShown, setMenuShown] = React.useState<bool>(false);

    function onGameButtonClick() { setMenuShown((prev) => !prev); }

    let menu: React.Node = '';
    if (menuShown) {
        menu = connection !== "connected" ?
            <Game.JoinMenu connection={connection}
                           setConnection={setConnection}
                           hide={() => setMenuShown(false)}
                           dispatch={gameDispatch}
                           eventDispatch={eventDispatch} />
            : <Game.StatusMenu game={game}
                               setConnection={setConnection}
                               dispatch={gameDispatch}
                               eventDispatch={eventDispatch} />;
    }

    // Page should be a flexbox.
    return (
        <ThemeProvider theme={theme}>
        <Game.Ctx.Provider value={game}>
        <Event.Ctx.Provider value={eventList}>
        <Game.DispatchCtx.Provider value={gameDispatch}>
        <Event.DispatchCtx.Provider value={eventDispatch}>

            {process.env.NODE_ENV !== "production" &&
                <DebugBar />
            }

            <SRHeader connection={connection}
                      menuShown={menuShown}
                      onClick={onGameButtonClick} />
            { menu }
            <UI.ColumnToRow grow>
                <AppLeft>
                    <RollDicePrompt connection={connection} />
                </AppLeft>
                <AppRight>
                    <EventHistory connection={connection}
                                  setConnection={setConnection} />
                </AppRight>
            </UI.ColumnToRow>

        </Event.DispatchCtx.Provider>
        </Game.DispatchCtx.Provider>
        </Event.Ctx.Provider>
        </Game.Ctx.Provider>
        </ThemeProvider>
    );
}
