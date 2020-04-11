// @flow

import './App.css';

import * as React from 'react';
import styled from 'styled-components/macro';

import SRHeader from 'header';
import JoinGamePrompt from 'join-game-prompt';
import RollDicePrompt from 'roll-dice';
import EventHistory from 'event/history-panel';
import RollInputPanel from 'roll/containers/roll-input-panel';
import RollHistoryPanel from 'roll/containers/roll-history-panel';

import { GameCtx, GameDispatchCtx, gameReducer } from 'game/state';
import { EventListCtx, EventDispatchCtx, eventListReducer } from 'event/state';

export default function App(props: {}) {
    const [game, gameDispatch] = React.useReducer(gameReducer, undefined);
    const [eventList, eventDispatch] = React.useReducer(eventListReducer, { events: [], eventID: 0 });
    const [showGameJoin, setShowGameJoin] = React.useState(false);

    function joinGameClicked() {
        setShowGameJoin((state) => !state);
    }


    // Page should be a flexbox.
    return (
        <div className="rounded-0">
            <GameCtx.Provider value={game}>
            <GameDispatchCtx.Provider value={gameDispatch}>
                <SRHeader expanded={showGameJoin} onClick={joinGameClicked} />
                {showGameJoin ? <JoinGamePrompt game={game} setShown={setShowGameJoin} /> : ''}
                <EventDispatchCtx.Provider value={eventDispatch}>
                    <RollDicePrompt game={game}
                                    dispatch={eventDispatch} />
                    <EventHistory eventList={eventList} />
                </EventDispatchCtx.Provider>
            </GameDispatchCtx.Provider>
            </GameCtx.Provider>
        </div>
    );
}
