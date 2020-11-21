// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import * as server from 'server';

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
        items.push(
            <UI.HashColored id={id} key={id}>
                {player}
            </UI.HashColored>
        );
    });

    return (
        <StyledList>
            {items}
        </StyledList>
    );
}
