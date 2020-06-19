// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as server from 'server';
import * as Game from 'game';
import { ConnectionCtx } from 'connection';

const StyledBar: StyledComponent<> = styled(UI.FlexColumn)`
    padding: 4px 8px;
    color: white;
    background-color: ${({theme}) => theme.colors.primary}b0;
    font-size: 14px;
    line-height: 1.25em;
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
        width: auto;
    }
`;

export default function DebugBar() {
    const gameState = React.useContext(Game.Ctx);
    const connection = React.useContext(ConnectionCtx);
    const game = !gameState ? gameState :
        {...gameState, player: undefined, players: undefined};
    const players = !gameState ? "N/A" : gameState.players.size;

    const cookie = document.cookie;
    const auth = React.useMemo(() => {
        try {
            const authMatch = cookie.match(/srAuth=[^.]+.([^.]+)/);
            return atob(authMatch[1]);
        }
        catch {
            return "N/A";
        }
    }, [cookie]);

    return (
        <StyledBar>
            <Group>
                <Item>
                    <b>
                        Shadowroller {process.env.NODE_ENV}&nbsp;
                    </b>
                    <tt>{server.BACKEND_URL}</tt>&nbsp;
                </Item>
                <Item>
                    <b>Connection:&nbsp;</b>
                    <tt>{connection}</tt>
                </Item>
                <Item>
                    <b>Auth:</b>&nbsp;
                    <tt>{auth}</tt>
                </Item>
            </Group>
            <Group>
                <Item>
                    <b>Game:&nbsp;</b>
                    <tt>{JSON.stringify(game) ?? 'undefined'}</tt>
                </Item>
                <Item>
                    <b>Players:&nbsp;</b>
                    <tt>{JSON.stringify(players)}</tt>
                </Item>
            </Group>
        </StyledBar>
    );
}