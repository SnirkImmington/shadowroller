import * as React from 'react';
import * as UI from 'style';
import * as dice from 'component/Dice';
import * as humanTime from 'component/HumanTime';
import * as Roll from './RollComponents';

import * as Event from 'event';
import * as Share from 'share';
import * as rollStats from 'roll/stats';

type Props = {
    event: Event.Roll,
    playerID: string|null,
    hue: number|null|undefined,
    noActions?: boolean
}
function RollRecordInner({ event, playerID, hue, noActions }: Props, ref: React.Ref<HTMLDivElement>) {
    const result = rollStats.results(event);
    const canModify = !noActions && Event.canModify(event, playerID);

    const intro: React.ReactNode = event.source !== "local" ? (
        <>
            <UI.PlayerColored hue={hue}>
                {(event.source.share !== Share.Mode.InGame) &&
                    <UI.FAIcon className="icon-inline" transform="grow-4" icon={Share.icon(event.source.share)} />}
                {event.source.name}
            </UI.PlayerColored>
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
                <Roll.Results hue={hue} result={result} />
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
