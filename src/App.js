// @flow

import './App.css';

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

import * as Game from 'game';
import * as Event from 'event';

import SRHeader from 'header';
import JoinGamePrompt from 'join-game-prompt';
import RollDicePrompt from 'roll-dice';
import EventHistory from 'event/history-panel';

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
    const [game, gameDispatch] = React.useReducer(Game.reduce, undefined);
    // Not sure what the problem is here.
    const [eventList, eventDispatch] = React.useReducer(Event.reduce, Event.defaultState);
    const [showGameJoin, setShowGameJoin] = React.useState(false);

    function joinGameClicked() {
        setShowGameJoin((state) => !state);
    }

    React.useEffect(() => server.initialCookieCheck(gameDispatch, eventDispatch), []);

    // Page should be a flexbox.
    return (
        <Game.Ctx.Provider value={game}>
        <Game.DispatchCtx.Provider value={gameDispatch}>

            <SRHeader game={game} expanded={showGameJoin} onClick={joinGameClicked} />

            <AppPadding>

                <Event.DispatchCtx.Provider value={eventDispatch}>

                <AppLeft>
                   { showGameJoin &&
                       <JoinGamePrompt game={game} setShown={setShowGameJoin} />}
                    <RollDicePrompt game={game}
                                    dispatch={eventDispatch} />
                </AppLeft>
                <AppRight>
                    <EventHistory eventList={eventList} />
                </AppRight>
                </Event.DispatchCtx.Provider>

            </AppPadding>

        </Game.DispatchCtx.Provider>
        </Game.Ctx.Provider>
    );
}
