import * as React from 'react';
import { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as Text from 'component/Text';
import * as Button from 'component/Button';
import * as icons from 'style/icon';
import * as dice from 'component/Dice';
import * as humanTime from 'component/HumanTime';
import * as Roll from './RollComponents';

import type { Connection } from 'connection';
import * as Event from 'event';
import * as Share from 'share';
import * as routes from 'routes';
import * as colorUtil from 'colorUtil';

type Props = {
    event: Event.Initiative,
    playerID: string|null,
    hue: number|null|undefined,
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
                <Button.Minor onClick={onSeize}>
                    <Button.Icon icon={icons.faSortAmountUp} />
                    seize the initiative
                </Button.Minor>
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
            {event.source !== "local" && event.source.share === Share.Mode.GMs &&
                <Button.Minor disabled={connection === "connecting"} onClick={onReveal}>
                    <Button.Icon className="icon-inline" icon={icons.faUsers} transform="grow-8" />
                    {' reveal'}
                </Button.Minor>
            }
            {canSeize &&
                <Button.Minor disabled={connection === "connecting"} onClick={onSeize}>
                    <Button.Icon icon={icons.faSortAmountUp} />
                    seize the initiative
                </Button.Minor>
            }
        </UI.FlexRow>
    );
}

function InitiativeRecord({ event, playerID, hue, noActions }: Props, ref: React.Ref<HTMLDivElement>) {
    const theme = React.useContext(ThemeContext);

    const result = event.base + event.dice.reduce((curr, die) => curr + die, 0);
    const canModify = !noActions && Event.canModify(event, playerID);
    const color = colorUtil.playerColor(hue, theme);

    let action: React.ReactNode;
    if (event.source === "local") {
        action = event.blitzed ? <b>Blitzed</b> : (event.seized ? <b>Seized</b> : "Rolled");
    } else {
        action = event.blitzed ? <b>blitzes</b> : (event.seized ? <b>seizes</b> : "rolls");
    }

    const intro: React.ReactNode = event.source !== "local" ? (
        <>
            <Text.Player hue={hue}>
                {(event.source.share !== Share.Mode.InGame) &&
                    <UI.FAIcon className="icon-inline" transform="grow-4" icon={Share.icon(event.source.share)} />}
                {event.source.name}
            </Text.Player>
            &nbsp;{action}
        </>
    ) : (
        action
    );
    const title = (
        <>for { event.title ? <b>{event.title}</b> : "initiative"}</>
    );
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
                    {event.seized &&
                        <UI.FAIcon icon={icons.faSortAmountUp} color={color} fixedWidth />
                    }
                <Roll.Title>
                    {title}
                </Roll.Title>
                </UI.FlexRow>
                <Roll.StyledResults hue={hue}>
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
                    <Text.Small>&nbsp;(edited)</Text.Small>}
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
