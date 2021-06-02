import * as React from 'react';
import styled, { ThemeContext } from 'styled-components/macro';
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

const GMIcon = styled(UI.FAIcon).attrs({
    icon: icons.faChessQueen,
    className: "icon-online icon-gm",
    transform: "grow-1",
})(({theme}) => ({
    color: theme.colors.highlight,
    marginLeft: "0.5rem",
}));

type PlayerNameProps = {
    player: Player.Info,
    isGM: boolean,
}

export function PlayerName({ player, isGM }: PlayerNameProps) {
    const theme = React.useContext(ThemeContext);
    return (
        <UI.FlexRow>
            {player.online ?
                    <OnlineIcon color={theme.colors.indicatorOnline} className="sr-icon-svg" />
                    : <OfflineIcon color={theme.colors.neutral} className="sr-icon-svg" />
            }
            <UI.PlayerColored hue={player.hue}>
                {player.name}
            </UI.PlayerColored>
            {isGM && <GMIcon />}
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
