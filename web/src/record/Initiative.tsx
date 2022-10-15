import * as React from 'react';
import { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as Text from 'component/Text';
import * as Button from 'component/Button';
import Input from 'component/Input';
import * as icons from 'style/icon';
import * as dice from 'component/Dice';
import * as humanTime from 'component/HumanTime';
import NumericInput from 'component/NumericInput';
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
                    <Button.Icon className="icon-inline" icon={icons.faUsers} transform="grow-6" />
                    {'reveal'}
                </Button.Minor>
            }
            {canSeize &&
                <Button.Minor disabled={connection === "connecting"} onClick={onSeize}>
                    <Button.Icon icon={icons.faSortAmountUp} />
                    seize the initiative
                </Button.Minor>
            }
            <Button.Minor onClick={() => {}}>
                edit
            </Button.Minor>
        </UI.FlexRow>
    );
}

interface TitleProps {
    event: Event.Initiative,
    setBase?: ((value: number | null) => void),
    setTitle?: ((value: string) => void),
    hue: number | null | undefined;
}
function LocalInitiativeTitle({ event, setBase, setTitle, hue }: TitleProps) {
    // Rolled 12 + 2d6 for initiative
    // Blitzed 12 + 5d6 for initiative
    // Rolled 2 + 1d6 for matrix ini

    let verb: React.ReactNode;
    if (event.blitzed) {
        verb = <b>Blized</b>;
    } else if (event.seized) {
        verb = <b>Seized</b>;
    } else {
        verb = "Rolled";
    }

    let base: React.ReactNode;
    if (setBase) {
        base = <NumericInput id={`initiative-${event.id}-edit-base`}
            value={event.base} onSelect={setBase} />;
    } else {
        base = <>&nbsp;{event.base ?? "0"}</>;
    }

    let diceList = (
        <>
            {event.dice.length}d6&nbsp;<dice.List small rolls={event.dice} />&nbsp;
        </>
    );

    let reason: React.ReactNode;
    if (setTitle) {
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
        };
        reason = <Input id={`initiative-${event.id}-edit-title`}
            value={event.title} onChange={onChange} />;
    } else {
        reason = event.title || "initiative";
    }

    return (
        <UI.FlexRow flexWrap>
            {verb}{base} + {diceList} for {reason}
        </UI.FlexRow>
    );
}

function GameInitiativeTitle({ event, setBase, setTitle, hue }: TitleProps) {
    // Snirk rolled 12 + 2d6 for initiative
    // {share} {name} rolled
    if (event.source === "local") {
        throw new Error("GameInitiativeTitle got a local event");
    }

    let subject: React.ReactNode = (
        <>
            {(event.source.share !== Share.Mode.InGame) &&
                <UI.FAIcon className="icon-inline" transform="grow-4" icon={Share.icon(event.source.share)} />}

            <Text.Player hue={hue}>{event.source.name}</Text.Player>
        </>
    );

    let action: React.ReactNode;
    if (event.blitzed) {
        action = <b>blitzes</b>;
    } else if (event.seized) {
        action = <b>seizes</b>;
    } else {
        action = "rolls";
    }

    let base: React.ReactNode;
    if (setBase) {
        base = <NumericInput id={`initiative-${event.id}-edit-base`}
            value={event.base} onSelect={setBase} />;
    } else {
        base = <>&nbsp;{event.base ?? "0"}&nbsp;</>;
    }

    let reason: React.ReactNode;
    if (setTitle) {
        const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
        };
        reason = <Input id={`initiative-${event.id}-edit-title`}
            value={event.title} onChange={onChange} />;
    } else {
        reason = event.title;
    }

    return (
        <UI.FlexRow flexWrap>
            {subject}&nbsp;{action}{base} + &nbsp;<dice.List small rolls={event.dice} />&nbsp; for &nbsp; {reason}
        </UI.FlexRow>
    );
}

function InitiativeEditRecord({ event, playerID, hue, noActions }: Props, ref: React.Ref<HTMLDivElement>) {
    const theme = React.useContext(ThemeContext);
    const [newBase, setNewBase] = React.useState(event.base);
    const [newTitle, setNewTitle] = React.useState(event.title);
    const [newSeized, setNewSeized] = React.useState(event.seized);
    const [editing, setEditing] = React.useState(false);
    const color = colorUtil.playerColor(hue, theme);
    const canModify = !noActions && Event.canModify(event, playerID);
    const isEditing = canModify && editing;
    const isLocal = event.source === "local";

    function numericInputSetNewBase(value: number | null) {
        if (value === null) {
            setNewBase(event.base);
        } else {
            setNewBase(value);
        }
    }

    const result = (isEditing ? newBase : event.base) + event.dice.reduce((curr, die) => curr + die, 0);

    const editedEvent = isEditing ? event : { ...event, title: newTitle, base: newBase, seized: newSeized };
    let Title = isLocal ? LocalInitiativeTitle : GameInitiativeTitle;

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <Title event={editedEvent} hue={hue}
                    setBase={isEditing ? numericInputSetNewBase : undefined}
                    setTitle={isEditing ? setNewTitle : undefined} />
                <Roll.StyledResults hue={hue}>
                    {result}
                    &nbsp;
                    {event.blitzed && <UI.FAIcon className="icon-inline" icon={icons.faBolt} color={color} fixedWidth />}
                    {event.seized && <UI.FAIcon className="icon-inline" icon={icons.faSortAmountUp} />}
                    <UI.FAIcon className="icon-inline" icon={icons.faClipboardList} />
                </Roll.StyledResults>
            </UI.FlexRow>
            <UI.FlexRow style={{ minHeight: "1rem" }} floatRight={canModify}>
                <humanTime.Since date={Event.timeOf(event)} />
                {event.edit &&
                    <Text.Small>
                        &nbsp;(edited <humanTime.Since date={new Date(event.edit)} />)
                    </Text.Small>}
                {canModify && (
                    event.source === "local" ?
                        <LocalActionsRow event={event} />
                        : <GameActionsRow event={event} />
                )}
            </UI.FlexRow>
        </UI.FlexColumn>
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
            {(event.source.share !== Share.Mode.InGame) &&
                <UI.FAIcon className="icon-inline" transform="grow-4" icon={Share.icon(event.source.share)} />}
            <Text.Player hue={hue}>
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
            <UI.FlexRow style={{minHeight: "1rem"}} floatRight={canModify}>
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

export const Initiative = React.memo<Props>(React.forwardRef(InitiativeEditRecord));
