// @flow

import './App.css';

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

import SRHeader from 'header';
import JoinGamePrompt from 'join-game-prompt';
import RollDicePrompt from 'roll-dice';
import EventHistory from 'event/history-panel';

import { GameCtx, GameDispatchCtx, gameReducer } from 'game/state';
import { EventDispatchCtx, eventListReducer } from 'event/state';
import * as server from 'server';

const AppPadding: StyledComponent<> = styled.div`
    /* Phones: margin near the side of the screen */
    margin: 0px .5em;
    display: flex;
    flex-direction: column;

    /* Tablet+: more margin on the sides */
    @media all and (min-width: 768px) {
        margin: 0px 1.5em;
        flex-direction: row;
    }
`;

const AppLeft: StyledComponent<> = styled.div`
    /* Phones: vertical margin included in cards. */

    /* Tablet+: roll history on right. */
    @media all and (min-width: 768px) {
        margin-right: 0.5em;
        flex-grow: 3;
    }
`;

const AppRight: StyledComponent<> = styled.div`
    /* Phones: no padding needed. */

    @media all and (min-width: 768px) {
        flex-grow: 1;
    }
`;

export default function App(props: {}) {
    const [game, gameDispatch] = React.useReducer(gameReducer, undefined);
    const [eventList, eventDispatch] = React.useReducer(eventListReducer, { events: [], eventID: 0 });
    const [showGameJoin, setShowGameJoin] = React.useState(false);

    function joinGameClicked() {
        setShowGameJoin((state) => !state);
    }

    React.useEffect(() => server.initialCookieCheck(gameDispatch, eventDispatch), []);

    // Page should be a flexbox.
    return (
        <GameCtx.Provider value={game}>
        <GameDispatchCtx.Provider value={gameDispatch}>

            <SRHeader game={game} expanded={showGameJoin} onClick={joinGameClicked} />

            <AppPadding>

                <EventDispatchCtx.Provider value={eventDispatch}>

                <AppLeft>
                   { showGameJoin &&
                       <JoinGamePrompt game={game} setShown={setShowGameJoin} />}
                    <RollDicePrompt game={game}
                                    dispatch={eventDispatch} />
                </AppLeft>
                <AppRight>
                    <EventHistory eventList={eventList} />
                </AppRight>
                </EventDispatchCtx.Provider>

            </AppPadding>

        </GameDispatchCtx.Provider>
        </GameCtx.Provider>
    );
}
