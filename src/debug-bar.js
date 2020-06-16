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
    flex-wrap: wrap;
    line-height: 1.25em;
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
            <UI.FlexRow wrap>
                <div style={{flexGrow: '1'}}>
                    <b>
                        Shadowroller {process.env.NODE_ENV}&nbsp;
                    </b>
                    <tt>{server.BACKEND_URL}</tt>&nbsp;
                </div>
                <div style={{flexGrow: 1}}>
                    <b>Connection:&nbsp;</b>
                    <tt>{connection}</tt>
                </div>
                <div style={{marginLeft: 'auto' }}>
                    <b>Game:&nbsp;</b>
                    <tt>{JSON.stringify(game) ?? 'undefined'}</tt>
                </div>
            </UI.FlexRow>
            <UI.FlexRow wrap>
                <div style={{flex: 'flex-shrink'}}>
                    <b>Auth:</b>&nbsp;
                    <tt>{auth}</tt>
                </div>
                <div style={{marginLeft: 'auto'}}>
                    <b>Players:&nbsp;</b>
                    <tt>{JSON.stringify(players)}</tt>
                </div>
            </UI.FlexRow>
        </StyledBar>
    );
}
