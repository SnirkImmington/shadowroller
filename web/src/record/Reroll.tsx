import * as React from 'react';
import * as UI from 'style';
import * as Text from 'component/Text';
import * as dice from 'component/Dice';
import * as humanTime from 'component/HumanTime';
import * as icons from 'style/icon';
import * as Roll from './RollComponents';

import * as Event from 'event';
import * as Share from 'share';
import * as rollStats from 'roll/stats';

type Props = {
    event: Event.RerollFailures,
    playerID: string|null,
    hue: number|null|undefined,
    noActions?: boolean
}

export default function RerollRecord({ event, playerID, hue, noActions }: Props) {
    const result = rollStats.results(event);
    const canModify = !noActions && Event.canModify(event, playerID);

    const intro: React.ReactNode = event.source !== "local" ? (
        <>
            <Text.Player hue={hue}>
                {(event.source.share !== Share.Mode.InGame) &&
                    <UI.FAIcon className="icon-inline" transform="grow-4" icon={Share.icon(event.source.share)} />}
                {event.source.name}
            </Text.Player>
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
        <UI.FlexColumn>
            <UI.FlexRow alignItems="flex-start">
                <Roll.Title>
                    {intro} {title}
                    {event.glitchy !== 0 &&
                        ` (glitchy ${Roll.SignDisplayFormat.format(event.glitchy)})`}
                </Roll.Title>
                <Roll.Results hue={hue} result={result} />
            </UI.FlexRow>
            <Roll.Scrollable>
                <dice.List rolls={event.rounds[1]} />
                <Roll.Rounds icon={icons.faRedo} hue={hue}
                             rounds={[event.rounds[0]]} />
            </Roll.Scrollable>
            <UI.FlexRow floatRight={canModify}>
                <humanTime.Since date={Event.timeOf(event)} />
                {event.edit &&
                    <Text.Small>&nbsp;(edited)</Text.Small>}
                {canModify &&
                    <Roll.ActionsRow event={event} result={result} />}
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}
