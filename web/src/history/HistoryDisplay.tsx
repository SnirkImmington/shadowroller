import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import * as icons from 'style/icon';
import theme from 'style/theme';

import * as Game from 'game';
import * as Event from 'event';
import * as Player from 'player';
import * as srutil from 'srutil';

import { LoadingResultList } from "history/LoadingEventList";
import EditEventMenu from 'history/EditEventMenu';
import PlayerList from 'game/PlayerList';

const DO_SOME_ROLLS_FLAVOR = [
    "You have to press that roll button first, chummer.",
    "You gotta roll those dice first.",
    "Hit that roll button and we'll show you the glitches."
];

const GAME_EMPTY_FLAVOR = [
    "Looks like nothing much has happened here.",
    "Looks like you've joined a really boring game.",
    "Be the first one to roll!",
];

const HistoryFlavor = styled(UI.Flavor)`
    margin: 1em auto;
`;

export default function EventHistory() {
    const game = React.useContext(Game.Ctx);
    const player = React.useContext(Player.Ctx);
    const events = React.useContext(Event.Ctx);

    const [rollFlavor] = srutil.useFlavor(DO_SOME_ROLLS_FLAVOR);
    const [emptyGameFlavor] = srutil.useFlavor(GAME_EMPTY_FLAVOR);

    const hasRolls = events.events.length > 0;

    let title = "Results";
    if (game?.gameID) {
        title = game.gameID;
    }

    let body: React.ReactNode = '';
    if (!hasRolls && game && events.historyFetch === "finished") {
        body = (<HistoryFlavor>{emptyGameFlavor}</HistoryFlavor>);
    }
    else if (!hasRolls && !game) {
        body = (<HistoryFlavor>{rollFlavor}</HistoryFlavor>);
    }
    else {
        body = (<LoadingResultList playerID={player?.id ?? null} />);
    }

    return (
        <>
        {events.editing &&
            <EditEventMenu event={events.editing} />
        }
        <UI.Card unpadded padRight grow color={theme.colors.primary}>
            <UI.FlexRow maxWidth>
                <UI.CardTitleText color={theme.colors.primary} style={{ marginRight: '0.5rem'}}>
                    <UI.FAIcon icon={icons.faList} />
                    {title}
                    {events.historyFetch === "fetching" && "..."}
                </UI.CardTitleText>
                {game && <PlayerList />}
            </UI.FlexRow>
            <UI.FlexColumn grow>
                {body}
            </UI.FlexColumn>
        </UI.Card>
        </>
    );
}
