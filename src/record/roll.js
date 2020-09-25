// @flow

import * as React from 'react';
import * as UI from 'style';
import * as dice from 'dice';
import * as humanTime from 'humanTime';
import * as Roll from './rollComponents';

import * as Game from 'game';
import * as Event from 'event';
import * as rollStats from 'rollStats';

type Props = {
    event: Event.Roll
}
function RollRecordInner({ event }: Props, ref) {
    const game = React.useContext(Game.Ctx);

    const color = Event.colorOf(event);
    const result = rollStats.results(event);
    const canModify = Event.canModify(event, game?.player?.id);

    const intro: React.Node = event.source !== "local" ? (
        <>
            <UI.HashColored id={event.source.id}>
                {event.source.name}
            </UI.HashColored>
            {` rolls`}
        </>
    ) : (
        <>Rolled</>
    );
    const title = event.title ? (
        <>to <b>{event.title}</b></>
    ) : (
        <>{event.dice.length} {event.dice.length === 1 ? "die" : "dice"}</>
    );

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <Roll.Title>{intro} {title}</Roll.Title>
                <Roll.Results color={color} result={result} />
            </UI.FlexRow>
            <Roll.Scrollable>
                <dice.List rolls={event.dice} />
            </Roll.Scrollable>
            <UI.FlexRow floatRight>
                <humanTime.Since date={Event.timeOf(event)} />
                <UI.FlexRow>
                    {canModify &&
                        <Roll.ActionsRow event={event} result={result} />}
                </UI.FlexRow>
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}
export const RollRecord = React.memo<Props>(React.forwardRef(RollRecordInner));
