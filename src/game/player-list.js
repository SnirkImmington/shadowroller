// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import * as Player from 'player';

const StyledList: StyledComponent<> = styled(UI.FlexRow)`
    flex-grow: 1;
    margin: auto .5em;
    overflow: hidden;
    & > * {
        margin-right: 1em;
    }
`;


type PlayerNameProps = {
    +player: Player.Info
}
export function PlayerName({ player }: PlayerNameProps) {
    const color = Player.colorOf(player);
    return (
        <UI.PlayerColored color={color}>
            {player.name}
        </UI.PlayerColored>
    );
}

export default function PlayerList() {
    const game = React.useContext(Game.Ctx);
    if (!game) {
        return null;
    }
    const items: React.Node[] = [];
    game.players.forEach((player, id) => {
        items.push(
            <PlayerName key={id} player={player} />
        );
    });

    return (
        <StyledList>
            {items}
        </StyledList>
    );
}
