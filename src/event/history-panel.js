// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as style from 'style';

import * as Event from 'event';
import * as Records from 'event/record';
import { useEvents } from 'server';

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

export default function EventHistory({ eventList }: { eventList: Event.List}) {
    useEvents();

    return (
        <style.Card grow color="slateGray">
            <>
                <b>Connected to a game?</b>
                <b>reconnect?</b>
            </>
            {''}
            {eventList.events.map(e => <EventRecord event={e} key={e.id} />)}
        </style.Card>
    );
}
