// @flow

import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';

import * as Game from 'game';
import * as Event from 'history/event';
import * as Player from 'player';
import * as server from 'server';
import * as Stream from 'stream-provider';
import routes from 'routes';
import { ConnectionCtx, SetConnectionCtx } from 'connection';
import type { RetryConnection } from 'connection';

import SRHeader from 'header';
import EditPlayerPanel from 'player/edit-panel';
import NewJoinMenu from 'game/new-join-menu';
import RollDicePrompt from 'roll-dice';
import RollInitiativePrompt from 'roll-initiative';
import EventHistory from 'history/history-panel';
import DebugBar from 'debug-bar';

import 'assets-external/source-code-pro.css';

const AppLeft: StyledComponent<> = styled(UI.FlexColumn)`
    /* Phones: vertical margin included in cards. */

    padding: 0.5rem;

    & > *:not(last-child) {
        margin-bottom: 1rem;
    }

    /* Tablet+: roll history on right. */
    @media all and (min-width: 768px) {
        flex-grow: 1; /* Balance with right */
        min-width: 20em;

        padding-right: 1rem;
        padding-top: 1rem;

        /* Space out dice and initiative on tablet+ */
        & > *:not(last-child) {
            margin-bottom: 1.5rem;
        }
    }
`;

const AppRight: StyledComponent<> = styled(UI.FlexColumn)`
    /* Phones: no padding needed. */
    /* height: 100%; Always go as high as possible. */
    flex-grow: 1;

    padding-left: 2px;

    @media all and (min-width: 768px) {
        width: 30rem;
        padding: 1rem 0 0 0;
    }
`;

function Shadowroller() {
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const connection = React.useContext(ConnectionCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const [connect, logout] = React.useContext(Stream.Ctx);

    const [menuShown, setMenuShown] = React.useState<bool>(true); // TODO for testing purposes
    const toggleMenu = React.useCallback(() => setMenuShown(s => !s), [setMenuShown]);

    // On first load, read credentials from localStorage and log in.
    React.useEffect(() => {
        server.loadCredentials();
        if (server.session) {
            routes.auth.reauth({ session: server.session })
                .onConnection(setConnection)
                .onResponse(response => {
                    server.handleLogin({
                        persist: true, response,
                        setConnection, connect,
                        gameDispatch,
                        playerDispatch,
                        eventDispatch
                    });
                })
                .onClientError(resp => {
                    if (process.env.NODE_ENV !== "production") {
                        console.log("Got client error for reauth: ", resp);
                    }
                    server.clearSession();
                    setConnection("offline");
                });
            setConnection("disconnected");
        }
        // We want this to only run on startup.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function onGameButtonClick() {
        toggleMenu();
        //
        setConnection((conn: RetryConnection) =>
            conn === "disconnected" || conn === "errored" ? "offline" : conn
        );
    }

    return (
        <ThemeProvider theme={theme}>
            {process.env.NODE_ENV !== "production" && false &&
                <DebugBar />
            }

            <SRHeader menuShown={menuShown}
                      onClick={toggleMenu} />
            <UI.ColumnToRow grow>
                <AppLeft>
                    {menuShown &&
                        (server.session ?
                          <EditPlayerPanel hide={toggleMenu} />
                        : <NewJoinMenu hide={toggleMenu} />)
                    }
                    <RollDicePrompt />
                    <RollInitiativePrompt />
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
    const [player, playerDispatch] = React.useReducer(Player.reduce, Player.defaultState);
    const [eventList, eventDispatch] = React.useReducer(Event.reduce, Event.defaultState);
    const [connection, setConnection] = React.useState<RetryConnection>("offline");

    return (
        <ConnectionCtx.Provider value={connection}>
        <SetConnectionCtx.Provider value={setConnection}>
        <Game.Ctx.Provider value={game}>
        <Game.DispatchCtx.Provider value={gameDispatch}>
        <Player.Ctx.Provider value={player}>
        <Player.DispatchCtx.Provider value={playerDispatch}>
        <Event.Ctx.Provider value={eventList}>
        <Event.DispatchCtx.Provider value={eventDispatch}>
        <Stream.Provider>

            <Shadowroller />

        </Stream.Provider>
        </Event.DispatchCtx.Provider>
        </Event.Ctx.Provider>
        </Player.DispatchCtx.Provider>
        </Player.Ctx.Provider>
        </Game.DispatchCtx.Provider>
        </Game.Ctx.Provider>
        </SetConnectionCtx.Provider>
        </ConnectionCtx.Provider>
    );
}
