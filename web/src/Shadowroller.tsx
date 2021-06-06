import * as React from 'react';
import styled, { ThemeProvider, ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as theme from 'theme';
import * as srutil from 'srutil';

import * as Game from 'game';
import * as Event from 'event';
import * as Player from 'player';
import * as server from 'server';
import * as stream from 'sseStream';
import * as routes from 'routes';
import { ConnectionCtx, SetConnectionCtx } from 'connection';
import type { RetryConnection } from 'connection';

import SRHeader from 'header/SRHeader';
import PlayerEditMenu from 'player/EditMenu';
import GameJoinMenu from 'game/JoinMenu';
import RollDiceMenu from 'DiceRollMenu';
import RollInitiativeMenu from 'InitiativeRollMenu';
import EventHistory from 'history/HistoryDisplay';
import DebugBar from 'component/DebugBar';

import colors from 'theme/pallette.module.css';
import styles from './Shadowroller.module.css';

const AppLeft = styled(UI.FlexColumn)`
    /* Phones: vertical margin included in cards. */

    ${({theme}) =>
        `color: ${theme.colors.text}; background-color: ${theme.colors.background};`}
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

    color: var(--color-text);
    background-color: var(--color-background);
    padding-left: 2px;

    @media all and (min-width: 768px) {
        width: 30rem;
        padding: 1rem 0 0 0;
    }
`;

export default function Shadowroller() {
    const game = React.useContext(Game.Ctx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const [connect] = React.useContext(stream.Ctx);
    const theme = React.useContext(ThemeContext);

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
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div style={{height: "100%"}} className={theme.colors.mode === "dark" ? colors.dark : colors.light}>
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
        </div>
    );
}
