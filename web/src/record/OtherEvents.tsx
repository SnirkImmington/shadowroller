import * as React from 'react';
import styled from 'styled-components/macro';

import * as UI from 'style';
import * as srutil from 'srutil';
import * as Text from 'component/Text';
import * as humanTime from 'component/HumanTime';
import * as Dice from 'component/Dice';
import * as Game from 'game';
import * as Event from 'event';

type PlayerJoinProps = {
    event: Event.PlayerJoin,
    playerID: string|null,
    hue: number|null|undefined,
};
export const PlayerJoin = React.memo(React.forwardRef<HTMLDivElement, PlayerJoinProps>(function PlayerJoin({ event, hue }: PlayerJoinProps, ref) {
    const game = React.useContext(Game.Ctx);

    const name = <Text.Player hue={hue}>{event.source.name}</Text.Player>;
    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <span style={{ lineHeight: '1.2' }}>
                    {name}{' joined '}
                    {game?.gameID != null ?
                        <tt>{game.gameID}</tt> : "the game"}.
                </span>
            </UI.FlexRow>
            <UI.FlexRow>
                <humanTime.Since date={Event.timeOf(event)} />
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}), (prev, next) => prev.event.id === next.event.id);

const LoadingPadding = styled.div({
    display: "flex",
    height: "1.75rem",
    alignItems: "center",
});

const LOADING_FLAVOR: string[] = [
    "Looking for the rolls...",
    "Locating the rolls...",

    "Fabricating some rolls...",

    "Where are those rolls agian?...",
    "Where did those rolls go?...",
    "Wait, are there more rolls?...",

    "Has anybody seen the rolls?...",
    "Where are those confounded rolls?...",
];

export const Loading = React.forwardRef<HTMLDivElement, {}>(function LoadingIndicator(_props, ref) {
    const [flavor] = srutil.useFlavor(LOADING_FLAVOR);
    return (
        <LoadingPadding ref={ref}>
            &nbsp;
            <Text.Flavor>{flavor}</Text.Flavor>
            &nbsp;
            <Dice.Spinner />
        </LoadingPadding>
    );
});
