// @flow

import * as React from 'react';

import * as UI from 'style';
import * as Event from 'event';

type PlayerJoinProps = {
    +event: Event.PlayerJoin,
};
export const PlayerJoin = React.memo<PlayerJoinProps>(function PlayerJoin({ event }) {
    const name = <UI.PlayerName id={event.player.id} name={event.player.name} />
    return (
        <span>
            {name}{` joined.`}
        </span>
    );
}, (prev, next) => prev.event.id === next.event.id);
