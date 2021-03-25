import * as React from 'react';
import * as UI from 'style';
import * as icons from 'style/icon';
import * as dice from 'Dice';
import * as humanTime from 'HumanTime';
import * as Roll from './RollComponents';

import * as Event from 'history/event';
import * as Share from 'share';

type Props = {
    event: Event.Initiative,
    playerID: string|null,
    color: string,
    noActions?: boolean,
};

type ActionProps = {
    event: Event.Initiative, result: number,
}

function LocalActionsRow({ event, result }: ActionProps) {
    const dispatch = React.useContext(Event.DispatchCtx);
    const canSeize = !event.blitzed && !event.seized;

    function onEdit() {
        // dispatch the edit thing
    }

    return (
        <UI.FlexRow spaced>
            <UI.LinkButton>-10</UI.LinkButton>
            <UI.LinkButton>-5</UI.LinkButton>
            <UI.LinkButton>-1</UI.LinkButton>
            <UI.LinkButton>+1</UI.LinkButton>
            {canSeize &&
               <UI.LinkButton>seize the initiative</UI.LinkButton>
            }
            <UI.LinkButton onClick={onEdit}>edit</UI.LinkButton>
        </UI.FlexRow>
    );
}

function InitiativeRecord({ event, color }: Props, ref: React.Ref<HTMLDivElement>) {
    const result = event.base + event.dice.reduce((curr, die) => curr + die, 0);
    const canModify = true;

    const intro: React.ReactNode = event.source !== "local" ? (
        <>
            <UI.PlayerColored color={color}>
                {(event.source.share !== Share.InGame) &&
                    <UI.FAIcon className="icon-inline" transform="grow-4" icon={Share.icon(event.source.share)} />}
                {event.source.name}
            </UI.PlayerColored>
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
    let icon: React.ReactNode = "";
    if (event.blitzed) {
        icon = (<UI.FAIcon icon={icons.faBolt} color={color} fixedWidth className="sr-die" />);
    }
    if (event.seized) {
        icon = (<UI.FAIcon icon={icons.faSortAmountUp} color={color} fixedWidth className="sr-die" />);
    }

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <UI.FlexRow flexWrap>
                    {icon}
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
            <UI.FlexRow formRow={canModify} floatRight={canModify}>
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
