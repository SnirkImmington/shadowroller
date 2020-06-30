// @flow

import * as React from 'react';

import * as UI from 'style';
import * as Event from 'event';

type PlayerJoinProps = {
    +event: Event.PlayerJoin,
};
export const PlayerJoin = React.memo<PlayerJoinProps>(function PlayerJoin({ event }) {
    const name = <UI.PlayerName id={event.source.id} name={event.source.name} />
    return (
        <span>
            {name}{` joined.`}
        </span>
    );
}, (prev, next) => prev.event.id === next.event.id);

export const Loading = React.memo<{}>(function LoadingIndicator() {
    return (
        <span>Getting some rolls... <UI.DiceSpinner /></span>
    );
});
