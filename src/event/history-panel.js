// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as style from 'style';

import * as Records from 'event/record';
import type { EventList, GameEvent } from 'event/state';
import { useEvents } from 'server';

function EventRecord({ event }: { event: GameEvent}) {
    switch (event.ty) {
        case "localRoll": return <Records.LocalRollRecord event={event} />;
        case "gameJoin": return <Records.GameJoinRecord event={event} />;
        case "gameConnect": return <Records.GameConnectRecord event={event} />;
        case "gameRoll": return <Records.GameRollRecord event={event} />;
        case "playerJoin": return <Records.PlayerJoinRecord event={event} />;
        default:
            (event: empty); // eslint-disable-line no-unused-expressions
            return '';
    }
}

export default function EventHistory({ eventList }: { eventList: EventList}) {
    useEvents();

    return (
        <style.Card color="slateGray">
            <>
                Some events:
            </>
            {''}
            {eventList.events.map(e => <EventRecord event={e} key={e.id} />)}
        </style.Card>
    );
}
