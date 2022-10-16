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
    onEdit?: () => void,
};

type EditProps = {
    event: Event.Initiative,
    playerID: string | null,
    hue: number | null | undefined,

    onSave: (event: Event) => void,
    onCancel: () => void,
}

type ActionProps = {
    event: Event.Initiative,
};

function EditButton({ editing, onClick }: { editing: boolean, onClick: () => void; }) {
    if (!editing) {
        return (
            <Button.Minor onClick={onClick}>
                <Button.Icon icon={icons.faPen} />
                edit
            </Button.Minor>
        );
    } else {
        return (
            <Button.Minor onClick={onClick}>
                cancel
            </Button.Minor>
        );
    }
}

function LocalActionsRow({ event, children }: React.PropsWithChildren<ActionProps>) {
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
            {children}
        </UI.FlexRow>
    );
}

function GameActionsRow({ event, children }: React.PropsWithChildren<ActionProps>) {
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
            {children}
        </UI.FlexRow>
    );
}

function LocalEditRow({ event }: ActionProps) {

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
            value={event.title} placeholder="initiative" onChange={onChange} />;
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

type LocalVerbProps = { blitzed: boolean, seized: boolean, };
function LocalVerb({ blitzed, seized }: LocalVerbProps) {
    if (blitzed) {
        return (<b>Blitzed</b>);
    } else if (seized) {
        return (<b>Seized</b>);
    } else {
        return <>Rolled</>;
    }
}

type InitiativeEditRecordProps = {
    event: Event.Initiative,
    hue: number | null | undefined,
    saving: boolean,
    onSave: (event: Event.Initiative) => void,
    onCancel: () => void,
};

function LocalInitiativeEditRecord({ event, hue, saving, onSave, onCancel }: InitiativeEditRecordProps, ref: React.Ref<HTMLDivElement>) {
    const theme = React.useContext(ThemeContext);
    const [newBase, setNewBase] = React.useState(event.base);
    const [newTitle, setNewTitle] = React.useState(event.title);
    const [newSeized, setNewSeized] = React.useState(event.seized);
    const color = colorUtil.playerColor(hue, theme);

    let message = "";
    if (newBase > 99) {
        message = "Initiative base too high";
    }
    else if (newTitle.length > 500) {
        message = "Initiative message too long";
    }

    function handleSetNewBase(value: number | null) {
        if (value === null) {
            setNewBase(event.base);
        } else {
            setNewBase(value);
        }
    }

    function handleSetTitle(e: React.ChangeEvent<HTMLInputElement>) {
        setNewTitle(e.target.value.trim());
    }

    function handleSaveClick(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        if (message !== "") {
            return;
        }
        const newEvent = {
            ...event,
            base: newBase,
            title: newTitle,
            seized: newSeized,
        };
        onSave(newEvent);
    }

    function handleCancelClick(e: React.MouseEvent<HTMLButtonElement>) {
        onCancel();
    }

    const result = newBase + event.dice.reduce((curr, die) => curr + die, 0);

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow formRow>
                <UI.FlexRow flexWrap>
                    <LocalVerb blitzed={event.blitzed} seized={newSeized} />
                    <NumericInput id={`initiative=${event.id}-edit-base`}
                        value={newBase} onSelect={handleSetNewBase} placeholder={event.base.toString()} />
                    +
                    {event.dice.length}d6&nbsp;
                    <dice.List small rolls={event.dice} />
                    for
                    <Input id={`initiative-${event.id}-edit-title`}
                        value={newTitle} placeholder={event.title || "initiative"} onChange={handleSetTitle} />
                </UI.FlexRow>
                <Roll.StyledResults hue={hue}>
                    {result}
                    &nbsp;
                    {event.blitzed && <UI.FAIcon className="icon-inline" icon={icons.faBolt} color={color} fixedWidth />}
                    {event.seized && <UI.FAIcon className="icon-inline" icon={icons.faSortAmountUp} />}
                    <UI.FAIcon icon={icons.faClipboardList} />
                </Roll.StyledResults>
            </UI.FlexRow>
            <UI.FlexRow style={{ minHeight: "1rem" }} floatRight>
                <humanTime.Since date={Event.timeOf(event)} />
                {event.edit &&
                    <Text.Small>
                        &nbsp;(edited <humanTime.Since date={new Date(event.edit)} />)
                    </Text.Small>
                }
                <UI.FlexRow>
                    <Button.Minor disabled={saving || message !== ""} onClick={handleSaveClick}>
                        save
                    </Button.Minor>
                    <Button.Minor onClick={handleCancelClick}>
                        cancel
                    </Button.Minor>
                </UI.FlexRow>
            </UI.FlexRow>
        </UI.FlexColumn>
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

    function handleEdit() {
        console.log('handleEdit called');
        setEditing(e => { console.log('edit: ', e, ' -> ', !e); return !e; });
    }

    const result = (isEditing ? newBase : event.base) + event.dice.reduce((curr, die) => curr + die, 0);

    const editedEvent = isEditing ? event : { ...event, title: newTitle, base: newBase, seized: newSeized };
    let Title = isLocal ? LocalInitiativeTitle : GameInitiativeTitle;

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow formRow>
                <Title event={editedEvent} hue={hue}
                    setBase={isEditing ? numericInputSetNewBase : undefined}
                    setTitle={isEditing ? setNewTitle : undefined} />
                <Roll.StyledResults hue={hue}>
                    {result}
                    &nbsp;
                    {event.blitzed && <UI.FAIcon className="icon-inline" icon={icons.faBolt} color={color} fixedWidth />}
                    {event.seized && <UI.FAIcon className="icon-inline" icon={icons.faSortAmountUp} />}
                    <UI.FAIcon icon={icons.faClipboardList} />
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


function EditingInitiativeRecord({ event, playerID, hue, onSave, onCancel }: EditProps, ref: React.Ref<HTMLDivElement>) {

}

function InitiativeRecord({ event, playerID, hue, noActions, onEdit }: Props, ref: React.Ref<HTMLDivElement>) {
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

    const ActionsRow = event.source === "local" ? LocalActionsRow : GameActionsRow;

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
                    <ActionsRow event={event}>
                        <Button.Minor onClick={onEdit}>
                            <Button.Icon icon={icons.faPen} />
                            edit
                        </Button.Minor>
                    </ActionsRow>
                )}
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}

export const Initiative = React.memo<Props>(React.forwardRef(InitiativeRecord));
