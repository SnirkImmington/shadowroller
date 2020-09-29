// @flow

import * as React from 'react';
import * as UI from 'style';
import * as dice from 'dice';
import * as humanTime from 'humanTime';
import * as Roll from './rollComponents';

import * as Event from 'event';
import * as rollStats from 'rollStats';

type Props = {
    +event: Event.Initiative, playerID: ?string, +noActions?: bool,
};
type ActionProps = {
    +event: Event.Initiative, result: number,
}

function LocalActionsRow({ event, result }: ActionProps) {
    const dispatch = React.useContext(Event.DispatchCtx);

    return (
        <UI.FlexRow spaced>
            <UI.LinkButton>-10</UI.LinkButton>
            <UI.LinkButton>-5</UI.LinkButton>
            <UI.LinkButton>-1</UI.LinkButton>
            <UI.LinkButton>edit</UI.LinkButton>
        </UI.FlexRow>
    );
}

function InitiativeRecord({ event, playerID, noActions }: Props, ref) {
    console.log("InitiativeRecord", arguments[0]);
    const color = Event.colorOf(event);
    const canModify = !noActions && Event.canModify(event, playerID);

    const result = event.base + event.dice.reduce((curr, die) => curr + die, 0);

    // snirk rolls initiative           24
    // 11 + [1] + [2]

    // snirk rolls 11 + [1] + [2] for initiative 24

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
    const title = (
        <>for <b>{event.title ?? "initiative"}</b></>
    );
    const dieList = (
        <UI.FlexRow>
            {event.base} + <dice.List small rolls={event.dice} />
        </UI.FlexRow>
    );

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <Roll.Title>
                    {intro}&nbsp;
                    {dieList}&nbsp;
                    {title}
                </Roll.Title>
                <b style={{ color }}>
                    {result}
                </b>
            </UI.FlexRow>
            <UI.FlexRow floatRight={canModify}>
                <humanTime.Since date={Event.timeOf(event)} />
                {event.edit &&
                    <UI.SmallText>&nbsp;(edited)</UI.SmallText>}
                {canModify &&
                    <LocalActionsRow event={event} result={result} />}
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}

export const Initiative = React.memo<Props>(React.forwardRef(InitiativeRecord));
