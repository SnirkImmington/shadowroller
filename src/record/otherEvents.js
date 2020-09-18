// @flow

import * as React from 'react';
import styled from 'styled-components/macro';

import * as UI from 'style';
import * as Game from 'game';
import * as Event from 'event';

const CenteredSpan = styled.span`
    margin: auto 0 auto 2px;
`;

type PlayerJoinProps = {
    +event: Event.PlayerJoin,
};
export const PlayerJoin = React.memo<PlayerJoinProps>(function PlayerJoin({ event }) {
    const game = React.useContext(Game.Ctx);

    const name = <UI.PlayerName id={event.source.id} name={event.source.name} />
    return (
        <CenteredSpan>
            {name}{' joined '}{game?.gameID || "the game"}.
        </CenteredSpan>
    );
}, (prev, next) => prev.event.id === next.event.id);

export const Loading = React.memo<{}>(function LoadingIndicator() {
    return (
        <span>Getting some rolls... <UI.DiceSpinner /></span>
    );
});
