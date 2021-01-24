// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import * as Player from 'player';

// flow-ignore-all-next-line Uh it's there
import { ReactComponent as OnlineIcon } from 'assets/icon-online.svg';
// flow-ignore-all-next-line Uh it's there
import { ReactComponent as OfflineIcon } from 'assets/icon-offline.svg';

const StyledList: StyledComponent<> = styled(UI.FlexRow)`
    flex-grow: 1;
    margin: auto .5em;
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
        <UI.FlexRow>
        {player.online ?
                <OnlineIcon className="sr-icon-svg" />
                : <OfflineIcon className="sr-icon-svg" />
        }
        <UI.PlayerColored color={color}>
            {player.name}
        </UI.PlayerColored>
        </UI.FlexRow>
    );
}

const ListScroll = styled.div`
    flex-grow: 1;
    overflow-x: scroll;
`;

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
        <ListScroll>
        <StyledList>
            {items}
        </StyledList>
        </ListScroll>
    );
}
