import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import * as server from 'server';
import * as Game from 'game';
import * as Player from 'player';
import { ConnectionCtx } from 'connection';

const StyledBar = styled(UI.FlexColumn).attrs(
    _ => ({ className: "scrollable" })
)`
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

type ItemProps = {
    align?: string,
    capped?: boolean
}
const Item = styled.div<ItemProps>`
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
    const game = React.useContext(Game.Ctx);
    const player = React.useContext(Player.Ctx);
    const connection = React.useContext(ConnectionCtx);

    const gameText = game ? game.gameID : "offline";
    const players = game ? Array.from(game.players.values()).map(p => p.name) : [];
    const gamePlayers = game?.players;

    const playersClicked = React.useCallback(() => {
        if (players.length === 0) {
            console.log("Debug bar: no players");
        }
        else {
            // flow-ignore-all-next-line console.table is somehow problematic
            console.table(gamePlayers);
        }
    }, [players, gamePlayers]);

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
                    <tt>{gameText}</tt>
                </Item>
                <Item align="center">
                    {player ? `Logged in as ${player.name}` : "offline"}
                </Item>
                <Item align="end">
                    <UI.LinkButton light onClick={playersClicked}>
                        <b>Players:</b>
                        <tt>{JSON.stringify(players)}</tt>
                    </UI.LinkButton>
                </Item>
            </Group>
        </StyledBar>
    );
}
