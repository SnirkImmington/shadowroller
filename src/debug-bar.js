// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as server from 'server';
import * as Game from 'game';
import * as Event from 'event';
import { ConnectionCtx } from 'connection';

const StyledBar: StyledComponent<> = styled(UI.FlexColumn)`
    padding: 4px 8px;
    color: white;
    background-color: ${({theme}) => theme.colors.primary}b0;
    font-size: 14px;
    line-height: 1.25em;
    white-space: pre;
    width: 100%;

    height: 6.25em;
    overflow-y: scroll;
    @media all and (min-width:768px) {
        height: auto;
        overflow: inherit;
    }
`;

const Group = styled(UI.ColumnToRow).attrs(() => ({
    maxWidth: true, flexWrap: true,
}))`
    @media all and (min-width: 768px) {
        justify-content: space-between;
    }
`;

const Item = styled.div`
    width: 100%;
    @media all and (min-width: 768px) {
        width: 33%;
        flex-grow: 1;
        ${({align}) => align &&
            `text-align: ${align};`}
        ${({capped}) => capped &&
            "width: 33vw; overflow-x: auto;"}
    }
`;

export default function DebugBar() {
    const gameState = React.useContext(Game.Ctx);
    const connection = React.useContext(ConnectionCtx);
    const eventState = React.useContext(Event.Ctx);

    const game: any[] = !gameState ? [] : [
        gameState.gameID, gameState.player.name, gameState.player.id
    ];
    const players = !gameState ? "N/A" : Array.from(gameState.players.values());
    const events = { ...eventState, events: undefined };

    const eventsClicked = React.useCallback(() => {
        if (eventState.events.length === 0) {
            console.log("Debug bar: No events.");
        }
        else {
            // flow-ignore-all-next-line It doesn't like console.table
            console.table(eventState.events);
        }
    }, [eventState]);

    const playersClicked = React.useCallback(() => {
        if (players.length === 0) {
            console.log("Debug bar: no players");
        }
        else {
            // flow-ignore-all-next-line console.table
            console.table(players);
        }
    }, [players]);

    return (
        <StyledBar>
            <Group>
                <Item align="start">
                    <b style={{ "textTransform": "capitalize" }}>
                        {process.env.NODE_ENV}:&nbsp;
                    </b>
                    <tt>{server.BACKEND_URL}</tt>&nbsp;
                </Item>
                <Item align="center">
                    <b>Connection:&nbsp;</b>
                    <tt>{connection}</tt>
                </Item>
                <Item align="end">
                    <b>Session:&nbsp;</b>
                    <tt>{server.session ?? 'N/A'}</tt>
                </Item>
            </Group>
            <Group>
                <Item align="start">
                    <b>Game:&nbsp;</b>
                    <tt>{JSON.stringify(game) ?? 'N/A'}</tt>
                </Item>
                <Item align="center">
                    <UI.LinkButton light onClick={eventsClicked}>
                        <b>
                            Events
                            ({eventState.events.length}):&nbsp;
                        </b>
                    </UI.LinkButton>
                    <tt>{JSON.stringify(events)}</tt>
                </Item>
                <Item align="end">
                    <UI.LinkButton light onClick={playersClicked}>
                        <b>
                            Players
                            ({gameState?.players?.size ?? 0}):
                            </b>
                    </UI.LinkButton>
                    <tt>{JSON.stringify(players)}</tt>
                </Item>
            </Group>
        </StyledBar>
    );
}
