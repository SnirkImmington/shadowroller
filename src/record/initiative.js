// @flow

import * as React from 'react';
import * as UI from 'style';
import * as icons from 'style/icon';
import * as dice from 'dice';
import * as humanTime from 'humanTime';
import * as Roll from './rollComponents';

import * as Event from 'event';

type Props = {
    +event: Event.Initiative, playerID: ?string, +noActions?: bool,
};
/*
type ActionProps = {
    +event: Event.Initiative, result: number,
}

function LocalActionsRow({ event, result }: ActionProps) {
    const dispatch = React.useContext(Event.DispatchCtx);

    function onEdit() {
        dispatch({ ty: "selectEdit", event });
    }

    return (
        <UI.FlexRow spaced>
            <UI.LinkButton>-10</UI.LinkButton>
            <UI.LinkButton>-5</UI.LinkButton>
            <UI.LinkButton>-1</UI.LinkButton>
            <UI.LinkButton>+1</UI.LinkButton>
            <UI.LinkButton onClick={onEdit}>edit</UI.LinkButton>
        </UI.FlexRow>
    );
}
*/

function InitiativeRecord({ event, playerID, noActions }: Props, ref) {
    const color = Event.colorOf(event);
    //const canModify = !noActions && Event.canModify(event, playerID);
    const result = event.base + event.dice.reduce((curr, die) => curr + die, 0);

    const intro: React.Node = event.source !== "local" ? (
        <>
            <UI.HashColored id={event.source.id}>
                {event.source.name}
            </UI.HashColored>
            &nbsp;rolls
        </>
    ) : (
        "Rolled"
    );
    const title = (
        <>for { event.title ? <b>{event.title}</b> : "initiative"}</>
    );
    const dieList = (
        <>
            &nbsp;{event.base || "?"} +&nbsp;<dice.List small rolls={event.dice} />
        </>
    );

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <UI.FlexRow flexWrap>
                    {intro}
                    {dieList}
                <Roll.Title>
                    {title}
                </Roll.Title>
                </UI.FlexRow>
                <Roll.StyledResults color={color} style={{ alignSelf: 'flex-start'}}>
                    {result} <UI.FAIcon icon={icons.faClipboardList} />
                </Roll.StyledResults>
            </UI.FlexRow>
            <UI.FlexRow>
                <humanTime.Since date={Event.timeOf(event)} />
                {event.edit &&
                    <UI.SmallText>&nbsp;(edited)</UI.SmallText>}
                {/* canModify &&
                <LocalActionsRow event={event} result={result} />*/}
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}

export const Initiative = React.memo<Props>(React.forwardRef(InitiativeRecord));