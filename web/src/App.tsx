import * as React from 'react';
import styled, { ThemeProvider } from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';
import * as srutil from 'srutil';

import * as Game from 'game';
import * as Event from 'event';
import * as Player from 'player';
import * as server from 'server';
import * as stream from 'sseStream';
import StreamProvider from 'sseStream/Provider';
import * as routes from 'routes';
import { ConnectionCtx, SetConnectionCtx } from 'connection';
import type { RetryConnection } from 'connection';

import SRHeader from 'header/SRHeader';
import PlayerEditMenu from 'player/EditMenu';
import GameJoinMenu from 'game/JoinMenu';
import RollDiceMenu from 'DiceRollMenu';
import RollInitiativeMenu from 'InitiativeRollMenu';
import EventHistory from 'history/HistoryDisplay';
import DebugBar from 'DebugBar';

import 'assets-external/source-code-pro.css';

const AppLeft = styled(UI.FlexColumn)`
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

const AppRight = styled(UI.FlexColumn)`
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
    const game = React.useContext(Game.Ctx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const [connect] = React.useContext(stream.Ctx);

    const [menuShown, toggleMenuShown] = srutil.useToggle(false);

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
                .onClientError((resp: any) => {
                    if (process.env.NODE_ENV !== "production") {
                        console.log("Got client error for reauth: ", resp);
                    }
                    server.clearSession();
                    setConnection("offline");
                });
            setConnection("disconnected");
        }
        // We want this to only run on startup.
        /// eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <ThemeProvider theme={theme}>

            <SRHeader onClick={toggleMenuShown} />
            <UI.ColumnToRow grow>
                <AppLeft>
                    {menuShown &&
                        (game ?
                          <PlayerEditMenu hide={toggleMenuShown} />
                        : <GameJoinMenu hide={toggleMenuShown} />)
                    }
                    <RollDiceMenu />
                    <RollInitiativeMenu />
                </AppLeft>
                <AppRight>
                    <EventHistory />
                </AppRight>
            </UI.ColumnToRow>
            {process.env.NODE_ENV !== "production" &&
                <DebugBar />
            }
        </ThemeProvider>
    );
}

export default function App(_props: {}) {
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
    );
}
