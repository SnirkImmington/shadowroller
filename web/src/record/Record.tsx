import * as Event from 'event';

import Roll from 'record/Roll';
import EdgeRoll from 'record/EdgeRoll';
import Reroll from 'record/Reroll';
import Initiative from 'record/Initiative';
import { PlayerJoin } from './OtherEvents';
import EditRoll from 'record/edit/Roll';
import EditInitiative from 'record/edit/Initiative';
import Wrapper from 'record/Wrapper';

type Props = {
    event: Event.Event,
    hue: number | null | undefined,
    playerID: string | null,
    noActions?: boolean;
};

/**  */
export function Record({ event, hue, playerID, noActions }: Props) {
    let Inner;
    switch (event.ty) {
        case "playerJoin":
            Inner = PlayerJoin;
            break;
        case "edgeRoll":
            Inner = EdgeRoll;
            break;
        case "rerollFailures":
            Inner = Reroll;
            break;
        case "roll":
            Inner = Roll;
            break;
        case "initiativeRoll":
            Inner = Initiative;
            break;
        default:
            if (process.env.NODE_ENV !== "production") {
                const event_: never = event;
                console.error("Record: attempt to render unknown event", event_);
            }
            return null;
    }
    return (
        <Wrapper hue={hue} highlight={false}>
            <Inner event={event as never} hue={hue} playerID={playerID} noActions={noActions} />
        </Wrapper>
    );
}

export function Edit({ event, hue, playerID }: Props) {
    let Inner;
    switch (event.ty) {
        case "playerJoin":
            Inner = PlayerJoin;
            break;
        case "edgeRoll":
        case "rerollFailures":
        case "roll":
            Inner = EditRoll;
            break;
        case "initiativeRoll":
            Inner = EditInitiative;
            break;
        default:
            if (process.env.NODE_ENV !== "production") {
                const event_: never = event;
                console.error("EditRecord: attempt to render unknown event", event_);
            }
            return null;
    }
    return (
        <Inner event={event as never} hue={hue} playerID={playerID} />
    );
}
