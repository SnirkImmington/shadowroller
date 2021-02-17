import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import * as Game from 'game';
import * as Player from 'player';

// flow-ignore-all-next-line Uh it's there
import { ReactComponent as OnlineIcon } from 'assets/icon-online.svg';
// flow-ignore-all-next-line Uh it's there
import { ReactComponent as OfflineIcon } from 'assets/icon-offline.svg';

const StyledList = styled(UI.FlexRow).attrs(
    _props => ({ className: "scrollable" })
)`
    flex-grow: 1;
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
    align-content: stretch;
    line-height: 1.1;
    & > *:not(:last-child) {
        margin-right: 1em;
    }
`;

type PlayerNameProps = {
    player: Player.Info
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

export default function PlayerList() {
    const game = React.useContext(Game.Ctx);
    if (!game) {
        return null;
    }
    const items: React.ReactNode[] = [];
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
