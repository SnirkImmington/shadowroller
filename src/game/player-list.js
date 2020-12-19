// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import * as icons from 'style/icon';
import theme from 'style/theme';
import * as srutil from 'srutil';

import * as Game from 'game';

const StyledList: StyledComponent<> = styled(UI.FlexRow)`
    flex-grow: 1;
    margin: auto .5em;
    overflow: hidden;
    & > * {
        margin-right: 1em;
    }
`;

export default function PlayerList() {
    const game = React.useContext(Game.Ctx);
    if (!game) {
        return null;
    }
    const items: React.Node[] = [];
    game.players.forEach((player, id) => {
        const color = srutil.hashedColor(id);
        const iconStyle = {
            marginRight: "0.25em", color
        };
        items.push(
            <UI.FlexRow key={id}>
                <UI.FAIcon icon={icons.faUser} style={iconStyle} />
                <UI.HashColored id={id} key={id}>
                    {player}
                </UI.HashColored>
            </UI.FlexRow>
        );
    });

    return (
        <StyledList>
            {items}
        </StyledList>
    );
}
