import * as React from 'react';

import * as Event from 'event';
import * as Record from 'record';
import { areEqual } from 'react-window';

type RecordProps = {
    event: Event.Event|null,
    playerID: string|null,
    hue: number|null|undefined,
    setHeight?: (height: number) => void,
    noActions?: boolean,
    editing?: boolean,
    style?: any
};
const EventRecord = React.memo<RecordProps>(function EventRecord(props) {
    const { event, playerID, hue, setHeight, noActions, editing, style } = props;

    const ref = React.useRef<HTMLDivElement|null>(null);
    React.useEffect(() => {
        if (ref.current && setHeight) {
            setHeight(ref.current.getBoundingClientRect().height);
        }
    }, [ref, setHeight]);
    if (!event) {
        return (
            <Record.StyledRecord hue={hue} style={style}>
                <Record.Loading ref={ref}/>
            </Record.StyledRecord>
        );
    }

    let Inner;

    switch (event.ty) {
        case "playerJoin":
            Inner = Record.PlayerJoin;
            break;
        case "edgeRoll":
            Inner = Record.EdgeRoll;
            break;
        case "rerollFailures":
            Inner = Record.Reroll;
            break;
        case "roll":
            Inner = Record.Roll;
            break;
        case "initiativeRoll":
            Inner = Record.Initiative;
            break;
        default:
            if (process.env.NODE_ENV !== "production") {
                const event_: never = event;
                console.error("Attempt to render unknown event", event_);
            }
            return null;
    }
    return (
        <Record.StyledRecord hue={hue} editing={editing} style={style}>
            {/* We do make sure we have the right event, given the switch above. */}
            <Inner ref={ref} playerID={playerID} hue={hue} event={event as never} noActions={noActions} />
        </Record.StyledRecord>
    );
}, areEqual);

export default EventRecord;
