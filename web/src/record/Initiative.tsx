import * as React from 'react';
import * as UI from 'style';
import * as icons from 'style/icon';
import * as dice from 'Dice';
import * as humanTime from 'HumanTime';
import * as Roll from './RollComponents';

import type { Connection } from 'connection';
import * as Event from 'event';
import * as Share from 'share';
import * as routes from 'routes';

type Props = {
    event: Event.Initiative,
    playerID: string|null,
    color: string,
    noActions?: boolean,
};

type ActionProps = {
    event: Event.Initiative,
}

function LocalActionsRow({ event }: ActionProps) {
    const dispatch = React.useContext(Event.DispatchCtx);
    const canSeize = !event.blitzed && !event.seized;

    function onSeize() {
        dispatch({ ty: "seizeInitiative", id: event.id, edit: Date.now().valueOf() });
    }

    return (
        <UI.FlexRow spaced>
            {canSeize &&
               <UI.LinkButton onClick={onSeize}>seize the initiative</UI.LinkButton>
            }
        </UI.FlexRow>
    );
}

function GameActionsRow({ event }: ActionProps) {
    const [connection, setConnection] = React.useState<Connection>("offline");

    const canSeize = !event.blitzed && !event.seized;

    function onSeize() {
        if (!canSeize) { return; }
        routes.game.editInitiative({ id: event.id, diff: { seized: true } })
            .onConnection(setConnection);
    }

    function onReveal() {
        routes.game.editShare({ id: event.id, share: Share.Mode.InGame })
            .onConnection(setConnection);
    }

    return (
        <UI.FlexRow spaced>
            {event.source !== "local" && event.source.share !== Share.Mode.InGame &&
                <UI.LinkButton disabled={connection === "connecting"} onClick={onReveal}>
                    <UI.FAIcon className="icon-inline" icon={icons.faUsers} transform="grow-8" />
                    {' reveal'}
                </UI.LinkButton>
            }
            {canSeize &&
                <UI.LinkButton disabled={connection === "connecting"} onClick={onSeize}>
                    <UI.FAIcon icon={icons.faSortAmountUp} />
                    seize the initiative
                </UI.LinkButton>
            }
        </UI.FlexRow>
    );
}

function InitiativeRecord({ event, playerID, color, noActions }: Props, ref: React.Ref<HTMLDivElement>) {
    const result = event.base + event.dice.reduce((curr, die) => curr + die, 0);
    const canModify = !noActions && Event.canModify(event, playerID);

    const intro: React.ReactNode = event.source !== "local" ? (
        <>
            <UI.PlayerColored color={color}>
                {(event.source.share !== Share.Mode.InGame) &&
                    <UI.FAIcon className="icon-inline" transform="grow-4" icon={Share.icon(event.source.share)} />}
                {event.source.name}
            </UI.PlayerColored>
            &nbsp;
            {event.blitzed ? <b>blitzes</b> : event.seized ? <b>seizes the initiative with</b> : "rolls"}
        </>
    ) : (
        "Rolled"
    );
    const title = !event.seized ? (
        <>for { event.title ? <b>{event.title}</b> : "initiative"}</>
    ) : (event.title ? (<>for <b>{event.title}</b></>) : "");
    const dieList = (
        <>
            &nbsp;{event.base ?? "0"} +&nbsp;<dice.List small rolls={event.dice} />
        </>
    );

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <UI.FlexRow flexWrap>
                    {intro}
                    {dieList}
                    {event.blitzed &&
                        <UI.FAIcon icon={icons.faBolt} color={color} fixedWidth />
                    }
                <Roll.Title>
                    {title}
                </Roll.Title>
                </UI.FlexRow>
                <Roll.StyledResults color={color}>
                    {result}&nbsp;
                    {event.seized ?
                       <UI.FAIcon icon={icons.faSortAmountUp} />
                       : <UI.FAIcon icon={icons.faClipboardList} />
                    }
                </Roll.StyledResults>
            </UI.FlexRow>
            <UI.FlexRow formRow={canModify} floatRight={canModify}>
                <humanTime.Since date={Event.timeOf(event)} />
                {event.edit &&
                    <UI.SmallText>&nbsp;(edited)</UI.SmallText>}
                {canModify && (
                    event.source === "local" ?
                        <LocalActionsRow event={event} />
                        : <GameActionsRow event={event} />
                )}
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}

export const Initiative = React.memo<Props>(React.forwardRef(InitiativeRecord));
