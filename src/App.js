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
    margin: 0px auto;
    display: flex;
    flex-direction: column;

    max-width: 95%;
    @media all and (min-width: 768px) {
        flex-direction: row;
        max-width: 98%; /* align items */
    }
`;

const AppLeft: StyledComponent<> = styled.div`
    /* Phones: padding between roll & history */
    padding: 5px 0px;

    /* Tablet+: roll history on right. */
    @media all and (min-width: 768px) {
        padding: 0px;
        margin-right: 5px;
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
            {showGameJoin ? <JoinGamePrompt game={game} setShown={setShowGameJoin} /> : ''}

            <AppPadding>

                <EventDispatchCtx.Provider value={eventDispatch}>

                <AppLeft>
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
