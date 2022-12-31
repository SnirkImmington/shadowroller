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
    hue: number|null|undefined,
};
export function PlayerJoin({ event, hue }: PlayerJoinProps) {
    const game = React.useContext(Game.Ctx);

    const name = <Text.Player hue={hue}>{event.source.name}</Text.Player>;
    return (
        <UI.FlexColumn>
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
}

const LoadingPadding = styled.div({
    display: "flex",
    height: "1.75rem",
    alignItems: "center",
});

const LOADING_FLAVOR: string[] = [
    "Fabricating some rolls...",

    "Dude, where're my rolls?...",

    "Has anybody seen the rolls?...",
    "Where are those confounded rolls?...",
];

export function Loading() {
    const [flavor] = srutil.useFlavor(LOADING_FLAVOR);
    return (
        <LoadingPadding>
            &nbsp;
            <Text.Flavor>{flavor}</Text.Flavor>
            &nbsp;
            <Dice.Spinner />
        </LoadingPadding>
    );
}
