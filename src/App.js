// @flow

import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';

import * as Game from 'game';
import * as Event from 'event';
import * as server from 'server';
import routes from 'routes';
import { ConnectionCtx, SetConnectionCtx } from 'connection';
import type { Connection } from 'connection';

import SRHeader from 'header';
import RollDicePrompt from 'roll-dice';
import EventHistory from 'event/history-panel';
import DebugBar from 'debug-bar';

import 'assets-external/source-code-pro.css';

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
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);

    const connection = React.useContext(ConnectionCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const [menuShown, setMenuShown] = React.useState<bool>(false);
    const hide = React.useCallback(() => setMenuShown(false), [setMenuShown]);

    const session = server.session;
    React.useEffect(() => {
        server.loadCredentials();
        if (server.session) {
            routes.auth.reauth({ session: server.session })
                .onConnection(setConnection)
                .onResponse(resp => {
                    server.handleLogin(
                        true, resp,
                        setConnection, gameDispatch, eventDispatch
                    )
                });
            setConnection("disconnected");
        }
    }, [session, setConnection, gameDispatch, eventDispatch]);

    function onGameButtonClick() {
        setMenuShown(shown => !shown);
        //
        setConnection((conn: Connection) =>
            conn === "disconnected" || conn === "errored" ? "offline" : conn
        );
    }

    let menu: React.Node = '';
    if (menuShown) {
        if (connection === "connected") {
            menu = <Game.StatusMenu />;
        }
        else if (server.session) {
            menu = <Game.ReconnectMenu hide={hide} />;
        }
        else {
            menu = <Game.JoinMenu hide={hide} />
        }
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
