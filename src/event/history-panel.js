// @flow

import * as React from 'react';
import styled from 'styled-components/macro';

import { LocalRollRecord } from 'event/record';
import type { EventList, GameEvent } from 'event/state';

function EventRecord({ event }: { event: GameEvent}) {
    switch (event.ty) {
        case "localRoll": return <LocalRollRecord event={event} />;
        case "gameJoin": return <GameJoinRecord event={event} />;
        case "gameConnect": return <GameConnectRecord event={event} />;
        case "gameRoll": return <GameRollRecord event={event} />;
        case "playerJoin": return <PlayerJoinRecord event={event} />;
        default:
            (event: empty); // eslint-disable-line no-unused-expressions
            return '';
    }
}

export default function EventHistory({ eventList }: { eventList: EventList}) {

}
