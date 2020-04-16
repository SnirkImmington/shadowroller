// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as style from 'style';

import * as Game from 'game';
import * as Event from 'event';
import * as Records from 'event/record';
import * as server from 'server';

function EventRecord({ event }: { event: Event.Event}) {
    switch (event.ty) {
        case "localRoll": return <Records.LocalRollRecord event={event} />;
        case "gameJoin": return <Records.GameJoinRecord event={event} />;
        case "gameLeave": return "gameleave";
        //case "gameConnect": return <Records.GameConnectRecord event={event} />;
        case "gameRoll": return <Records.GameRollRecord event={event} />;
        case "playerJoin": return <Records.PlayerJoinRecord event={event} />;
        default:
            (event: empty); // eslint-disable-line no-unused-expressions
            return '';
    }
}

type Props = {
    +game: Game.State,
    +eventList: Event.List,
    +connection: server.Connection,
    +setConnection: server.SetConnection
}
export default function EventHistory({ game, eventList, connection, setConnection }: Props) {
    server.useEvents(setConnection);

    return (
        <style.Card grow color="slateGray">
            <div>
                {game ? `Rolls from ${game.gameID}` : 'Roll history'}
                {game ? connection : ''}
            </div>
            {''}
            {eventList.events.map(e => <EventRecord event={e} key={e.id} />)}
        </style.Card>
    );
}
