// @flow

import * as React from 'react';
import * as UI from 'style';
import * as dice from 'dice';
import * as humanTime from 'humanTime';
import * as Roll from './rollComponents';

import * as Event from 'event';
import * as rollStats from 'rollStats';

type Props = {
    +event: Event.Roll, playerID: ?string, +noActions?: bool
}
function RollRecordInner({ event, playerID, noActions }: Props, ref) {
    const color = Event.colorOf(event);
    const result = rollStats.results(event);
    const canModify = !noActions && Event.canModify(event, playerID);

    const intro: React.Node = event.source !== "local" ? (
        <>
            <UI.HashColored id={event.source.id}>
                {event.source.name}
            </UI.HashColored>
            {` rolls`}
        </>
    ) : (
        "Rolled"
    );
    const title = event.title ? (
        <>to <b>{event.title}</b></>
    ) : (
        <>{event.dice.length} {event.dice.length === 1 ? "die" : "dice"}</>
    );

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <Roll.Title>
                    {intro} {title}
                    {event.glitchy !== 0 &&
                        ` (glitchy ${Roll.SignDisplayFormat.format(event.glitchy)})`}
                </Roll.Title>
                <Roll.Results color={color} result={result} />
            </UI.FlexRow>
            <Roll.Scrollable>
                <dice.List rolls={event.dice} />
            </Roll.Scrollable>
            <UI.FlexRow floatRight={canModify}>
                <humanTime.Since date={Event.timeOf(event)} />
                {event.edit &&
                    <UI.SmallText>&nbsp;(edited)</UI.SmallText>}
                {canModify &&
                    <Roll.ActionsRow event={event} result={result} />}
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}
export const RollRecord = React.memo<Props>(React.forwardRef(RollRecordInner));
