import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import * as icons from 'style/icon';

import * as Game from 'game';
import * as Player from 'player';

import { ReactComponent as OnlineIcon } from 'assets/icon-online.svg';
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
    player: Player.Info,
    isGM: boolean,
}

export function PlayerName({ player, isGM }: PlayerNameProps) {
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
            {isGM && <UI.FAIcon icon={icons.faChessQueen} className="icon-inline icon-gm" transform="grow-1" />}
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
            <PlayerName key={id} player={player} isGM={game.gms.includes(id)} />
        );
    });

    return (
        <StyledList>
            {items}
        </StyledList>
    );
}
