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
import type { GameDispatch } from 'game/state';
import { EventDispatchCtx, eventListReducer } from 'event/state';
import type { EventDispatch } from 'event/state';
import * as server from 'server';

function initialCookieCheck(dispatch: GameDispatch, eventDispatch: EventDispatch) {
    const authMatch = document.cookie.match(/srAuth=[^.]+.([^.]+)/);
    if (!authMatch) {
        return;
    }
    const auth = JSON.parse(atob(authMatch[1]));
    dispatch({
        ty: "join",
        gameID: auth.gid,
        player: { id: auth.pid, name: auth.pname },
        players: {}
    });
    eventDispatch({
        ty: "gameJoin", gameID: auth.gid
    })
    server.getPlayers().then(players => {
        dispatch({
            ty: "setPlayers", players
        })
    })
}

const AppPadding: StyledComponent<> = styled.div`
    margin: 0 auto;

    max-width: 95%;
    @media all and (min-width: 768) {
        max-width: 98%;
    }
`;

export default function App(props: {}) {
    const [game, gameDispatch] = React.useReducer(gameReducer, undefined);
    const [eventList, eventDispatch] = React.useReducer(eventListReducer, { events: [], eventID: 0 });
    const [showGameJoin, setShowGameJoin] = React.useState(false);

    function joinGameClicked() {
        setShowGameJoin((state) => !state);
    }

    React.useEffect(() => initialCookieCheck(gameDispatch, eventDispatch), []);

    // Page should be a flexbox.
    return (
            <GameCtx.Provider value={game}>
            <GameDispatchCtx.Provider value={gameDispatch}>
                <SRHeader game={game}
                          expanded={showGameJoin}
                          onClick={joinGameClicked} />
                {showGameJoin ? <JoinGamePrompt game={game} setShown={setShowGameJoin} /> : ''}
                <AppPadding>
                <EventDispatchCtx.Provider value={eventDispatch}>
                    <RollDicePrompt game={game}
                                    dispatch={eventDispatch} />
                    <EventHistory eventList={eventList} />
                </EventDispatchCtx.Provider>
                </AppPadding>
            </GameDispatchCtx.Provider>
            </GameCtx.Provider>
    );
}
