import * as React from 'react';
import * as UI from 'style';
import * as dice from 'component/Dice';
import * as humanTime from 'component/HumanTime';
import * as icons from 'style/icon';
import * as Roll from './RollComponents';

import * as Event from 'event';
import * as Share from 'share';
import * as rollStats from 'roll/stats';

type Props = {
    event: Event.EdgeRoll,
    playerID: string | null,
    hue: number|null|undefined,
    noActions?: boolean
}
function EdgeRollRecord({ event, playerID, hue, noActions }: Props, ref: React.Ref<any>) {
    const result = rollStats.results(event);
    const canModify = !noActions && Event.canModify(event, playerID);

    const intro: React.ReactNode = event.source !== "local" ? (
        <>
        <UI.PlayerColored hue={hue}>
                {(event.source.share !== Share.Mode.InGame) &&
                    <UI.FAIcon className="icon-inline" transform="grow-4" icon={Share.icon(event.source.share)} />}
                {event.source.name}
            </UI.PlayerColored>
            &nbsp;
            <b>pushes the limit</b>
        </>
    ) : (
        <b>Pushed the limit</b>
    );

    const title = event.title ? (
        <>to <b>{event.title}</b></>
    ) : (
        <>on {event.rounds[0].length} {event.rounds[0].length === 1 ? "die" : "dice"}</>
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
                <dice.List rolls={event.rounds[0]} />
                <UI.FlexRow>
                    <Roll.Rounds icon={icons.faBolt} hue={hue}
                                 rounds={event.rounds.slice(1)} />
                </UI.FlexRow>
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
export const EdgeRoll = React.memo<Props>(React.forwardRef(EdgeRollRecord));
