// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

import * as Game from 'game';
import * as Event from 'event';

import SRHeader from 'header';
import RollDicePrompt from 'roll-dice';
import EventHistory, { LoadingResultList } from 'event/history-panel';

import * as server from 'server';

const AppPadding: StyledComponent<> = styled.div`
    /* Phones: margin near the side of the screen */
    height: 100%; /* */
    padding: 0.5em;
    display: flex;
    flex-direction: column;

    /* Tablet+: more margin on the sides */
    @media all and (min-width: 768px) {
        padding: 1.5em;
        flex-direction: row;
        align-items: stretch;
    }
`;

const AppLeft: StyledComponent<> = styled.div`
    /* Phones: vertical margin included in cards. */

    /* Tablet+: roll history on right. */
    @media all and (min-width: 768px) {
        margin-right: 1.5em;
        flex-grow: 1; /* Grows out */
    }
`;

const AppRight: StyledComponent<> = styled.div`
    /* Phones: no padding needed. */
    height: 100%; /* Always go as high as possible. */

    @media all and (min-width: 768px) {
        width: 30em;
    }
`;

export default function App(props: {}) {
    const [game, gameDispatch] = React.useReducer(Game.reduce, undefined);
    const [eventList, eventDispatch] = React.useReducer(Event.reduce, Event.defaultState);
    const [connection, setConnection] = React.useState<server.Connection>("offline");

    React.useEffect(() =>
        server.initialCookieCheck(gameDispatch, setConnection), []);

    const [menuShown, setMenuShown] = React.useState<bool>(false);

    function onGameButtonClick() { setMenuShown((prev) => !prev); }

    let menu: React.Node = '';
    if (menuShown) {
        menu = connection !== "connected" ?
            <Game.JoinMenu connection={connection}
                           setConnection={setConnection}
                           hide={() => setMenuShown(false)}
                           dispatch={gameDispatch} />
            : <Game.StatusMenu game={game}
                               setConnection={setConnection}
                               dispatch={gameDispatch} />;
    }

    // Page should be a flexbox.
    return (
        <Game.Ctx.Provider value={game}>
        <Game.DispatchCtx.Provider value={gameDispatch}>
        <Event.DispatchCtx.Provider value={eventDispatch}>

            <SRHeader game={game}
                      connection={connection}
                      menuShown={menuShown}
                      onClick={onGameButtonClick} />
            { menu }
            <AppPadding>
                <AppLeft>
                    <RollDicePrompt connection={connection} dispatch={eventDispatch} />
                    <EventHistory game={game} connection={connection}
                                  setConnection={setConnection}
                                  eventList={eventList}
                                  dispatch={eventDispatch} />
                </AppLeft>
                <AppRight>
                    <LoadingResultList game={game}
                                  connection={connection}
                                  setConnection={setConnection}
                                  eventList={eventList}
                                  dispatch={eventDispatch} />

                </AppRight>
            </AppPadding>

        </Event.DispatchCtx.Provider>
        </Game.DispatchCtx.Provider>
        </Game.Ctx.Provider>
    );
}
