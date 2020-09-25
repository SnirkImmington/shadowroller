// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as humanTime from 'humanTime';

import * as UI from 'style';
import * as Game from 'game';
import * as Event from 'event';

type PlayerJoinProps = {
    +event: Event.PlayerJoin,
};
export const PlayerJoin = React.memo<PlayerJoinProps>(React.forwardRef(function PlayerJoin({ event }, ref) {
    const game = React.useContext(Game.Ctx);

    const name = <UI.PlayerName id={event.source.id} name={event.source.name} />
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

export const Loading = React.memo<{}>(React.forwardRef(function LoadingIndicator({}, ref) {
    return (
        <span ref={ref}>Getting some rolls... <UI.DiceSpinner /></span>
    );
}));
