// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import * as Event from 'event';

const StyledBar: StyledComponent<> = styled(UI.FlexRow)`
    height: 2.5em;
    padding: 0 8px;
    color: white;
    background-color: ${({theme}) => theme.colors.primary}b0;
    font-size: 14px;
    flex-wrap: wrap;
`;

export default function DebugBar() {
    const gameState = React.useContext(Game.Ctx);
    return (
        <StyledBar>
            <b>Shadowroller development</b>
            &nbsp;
            <UI.Button>button</UI.Button>
            &nbsp;
            <UI.LinkButton>button</UI.LinkButton>
            &nbsp;
            <UI.LinkButton disabled>button</UI.LinkButton>
            &nbsp;
            <UI.LinkButton light>button</UI.LinkButton>
            &nbsp;
            <UI.LinkButton light disabled>button</UI.LinkButton>

            <div style={{marginLeft: 'auto'}}>
                <b>Game state:&nbsp;</b>
                <tt>{JSON.stringify(gameState) ?? 'undefined'}</tt>
            </div>
        </StyledBar>
    );
}
