// @flow

import * as React from 'react';
import * as UI from 'style';
import * as dice from 'dice';
import * as humanTime from 'humanTime';
import * as icons from 'style/icon';
import * as Roll from './rollComponents';

import * as Event from 'event';
import * as Game from 'game';
import * as rollStats from 'rollStats';

type Props = {
    +event: Event.RerollFailures,
    +playerID: ?string,
    +noActions?: bool
}
function RerollRecord({ event, playerID, noActions }: Props, ref) {
    const color = Event.colorOf(event);
    const result = rollStats.results(event);
    const canModify = !noActions && Event.canModify(event, playerID);

    const intro: React.Node = event.source !== "local" ? (
        <>
            <UI.HashColored id={event.source.id}>
                {event.source.name}
            </UI.HashColored>
            &nbsp;
            <b>rerolls failures</b>
        </>
    ) : (
        <b>Rerolled failures</b>
    );

    const title = event.title ? (
        <>to <b>{event.title}</b></>
    ) : (
        <>on {event.rounds[1].length} {event.rounds[1].length === 1 ? "die" : "dice"}</>
    );

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow alignItems="flex-start">
                <Roll.Title>{intro} {title}</Roll.Title>
                <Roll.Results color={color} result={result} />
            </UI.FlexRow>
            <Roll.Scrollable>
                <dice.List rolls={event.rounds[1]} />
                <Roll.Rounds icon={icons.faRedo} color={color}
                             transform="grow-5"
                             rounds={[event.rounds[0]]} />
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
export const Reroll = React.memo<Props>(React.forwardRef(RerollRecord));
