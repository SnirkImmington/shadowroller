// @flow

import './App.css';

import * as React from 'react';
import styled from 'styled-components/macro';

import SRHeader from 'header';
import JoinGamePrompt from 'join-game-prompt';
import RollDicePrompt from 'roll-dice';
import RollInputPanel from 'roll/containers/roll-input-panel';
import RollHistoryPanel from 'roll/containers/roll-history-panel';

import { GameCtx, GameDispatchCtx, gameReducer } from 'game/state';
import { EventListCtx, EventDispatchCtx, eventListReducer } from 'event/state';

export default function App(props: {}) {
    const [gameState, gameDispatch] = React.useReducer(gameReducer, undefined);
    const [eventList, eventDispatch] = React.useReducer(eventListReducer, { events: [] });
    const [showGameJoin, setShowGameJoin] = React.useState(false);

    function joinGameClicked() {
        setShowGameJoin((state) => !state);
    }

    // Page should be a flexbox.
    return (
        <div className="rounded-0">
            <GameCtx.Provider value={gameState}>
            <GameDispatchCtx.Provider value={gameDispatch}>
                <SRHeader expanded={showGameJoin} onClick={joinGameClicked} />
                {showGameJoin ? <JoinGamePrompt setShown={setShowGameJoin} /> : ''}
                <EventDispatchCtx.Provider value={eventDispatch}>
                    <RollDicePrompt />
                    <div className="App-wide-container">
                        { /*<RollInputPanel />*/ }
                        <RollHistoryPanel eventList={eventList} />
                    </div>
                </EventDispatchCtx.Provider>
            </GameDispatchCtx.Provider>
            </GameCtx.Provider>
        </div>
    );
}
