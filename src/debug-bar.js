// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import * as Event from 'event';

const StyledBar: StyledComponent<> = styled(UI.FlexRow)`
    padding: 4px 8px;
    color: white;
    background-color: ${({theme}) => theme.colors.primary}b0;
    font-size: 14px;
    flex-wrap: wrap;
`;

export default function DebugBar() {
    const gameState = React.useContext(Game.Ctx);
    const game = !gameState ? gameState :
        {...gameState, players: undefined};
    const players = !gameState ? [] : Object.fromEntries(gameState.players.entries());
    return (
        <StyledBar>
            <div>
                <b>Shadowroller development</b>
                &nbsp;
                <UI.LinkButton light>button</UI.LinkButton>
                &nbsp;
                <UI.LinkButton light disabled>button</UI.LinkButton>
            </div>

            <div style={{marginLeft: 'auto'}}>
                <b>Game state:&nbsp;</b>
                <tt>{JSON.stringify(game) ?? 'undefined'}</tt>
            </div>
            <div style={{marginLeft: 'auto'}}>
                <b>Players:&nbsp;</b>
                <tt>{JSON.stringify(players)}</tt>
            </div>
        </StyledBar>
    );
}
