import * as React from 'react';
import { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as Text from 'component/Text';
import * as Button from 'component/Button';
import DeleteConfirm from 'component/DeleteConfirm';
import Input from 'component/Input';
import Checkbox from 'component/Checkbox';
import EventRecord from './EventRecord';
import * as icons from 'style/icon';
import * as dice from 'component/Dice';
import * as humanTime from 'component/HumanTime';
import NumericInput from 'component/NumericInput';
import * as Roll from './RollComponents';

import type { Connection } from 'connection';
import * as Event from 'event';
import * as Share from 'share';
import * as routes from 'routes';
import * as srutil from 'srutil';
import * as colorUtil from 'colorUtil';


type Props = {
    event: Event.Initiative,
    playerID: string|null,
    hue: number|null|undefined,
    noActions?: boolean,
    onEdit?: () => void,
};
type ActionProps = {
    event: Event.Initiative,
};

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

function InitiativeEditingRecord({ event, playerID, hue }: Props, ref: React.Ref<HTMLDivElement>) {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const eventCmdDispatch = React.useContext(Event.CmdCtx);

    const [title, setTitle] = React.useState(event.title);
    const [base, setBase] = React.useState(event.base);
    const [seized, toggleSeized] = srutil.useToggle(event.seized);
    const [deleteReady, setDeleteReady] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const newEvent: Event.Initiative = {
        ...event, title, base, seized
    };

    function handleSetBase(value: number | null) {
        if (value != null) {
            setBase(value);
        } else {
            setBase(event.base);
        }
    }

    function handleSetTitle(e: React.ChangeEvent<HTMLInputElement>) {
        setTitle(e.target.value);
    }

    function handleCancel() {
        eventDispatch({ ty: "clearEdit" });
    }

    const messages = [];
    const diff: Partial<Event.Initiative> = {};
    if (base < -2) {
        messages.push("Base too low");
    } else if (base > 69) {
        messages.push("Base too high");
    } else if (base !== event.base) {
        diff.base = base;
    }

    if (seized != event.seized) {
        diff.seized = seized;
    }

    if (title.trim().length > 128) {
        messages.push("Title too long");
    } else if (title !== event.title) {
        diff.title = title;
    }
    const changes = Object.keys(diff);

    function handleSave() {
        if (messages.length > 0 || changes.length === 0) {
            return;
        }
        console.log("Going to save");
        eventCmdDispatch({ ty: "edit", id: event.id, diff }, setLoading);
        console.log("Save dispatched");
        eventDispatch({ ty: "clearEdit" });
    }

    function handleDelete() {
        eventCmdDispatch({ ty: "del", id: event.id }, setLoading);
    }

    return (
        <UI.FlexColumn ref={ref}>
            <EventRecord event={newEvent} playerID={playerID} hue={hue} noActions />
            <UI.FlexRow flexWrap formRow style={{ marginTop: "0.5rem" }}>
                Roll
                <NumericInput small id={`edit-${event.id}-set-base`} min={-2} max={69}
                    placeholder={event.base.toString()} onSelect={handleSetBase} />
                +
                <NumericInput small id={`edit-${event.id}-set-dice`} disabled value={event.dice.length}
                    placeholder={event.dice.length.toString()} onSelect={() => { }} />
                d6 for
                <Input id={`edit-${event.id}-set-title`}
                    placeholder={event.title || "initiative"} value={title} onChange={handleSetTitle} />
            </UI.FlexRow>
            <UI.FlexRow formRow flexWrap spaced floatRight>
                <DeleteConfirm id={`event-${event.id}`} ready={deleteReady} setReady={setDeleteReady} onDelete={handleDelete} />
                <Checkbox id={`edit-${event.id}-blitz`} checked={event.blitzed} disabled onChange={() => { }}>
                    Blitz
                </Checkbox>
                <Checkbox id={`edit-${event.id}-seize-initiative`}
                    checked={seized} onChange={toggleSeized}>
                    Seize the initiative
                </Checkbox>
                <UI.FlexRow formRow spaced>
                    {messages.length == 1 &&
                        <Text.Small>
                            ({messages[0]})
                        </Text.Small>
                    }
                    {messages.length > 1 &&
                        <Text.Small>
                            ({messages[0]} +{messages.length - 1})
                        </Text.Small>
                    }
                    {messages.length === 0 && changes.length > 0 &&
                        <Text.Small>
                            ({changes.length} change{changes.length > 1 ? 's' : null})
                        </Text.Small>
                    }
                    {changes.length === 0 && messages.length === 0 &&
                        <Text.Small>(no changes)</Text.Small>
                    }
                    <Button.Minor id={`edit-${event.id}-save`} onClick={handleSave}
                        disabled={changes.length === 0 || messages.length !== 0 || loading}>
                        save
                    </Button.Minor>
                    <Button.Minor onClick={handleCancel}>
                        cancel
                    </Button.Minor>
                </UI.FlexRow>
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}

/** A record to be displayed of an initiative roll which is being edited. */
export const InitiativeEditing = React.memo<Props>(React.forwardRef(InitiativeEditingRecord));

function InitiativeRecord({ event, playerID, hue, noActions }: Props, ref: React.Ref<HTMLDivElement>) {
    console.log("InitiativeRecord:", event, ref);
    const theme = React.useContext(ThemeContext);
    const eventDispatch = React.useContext(Event.DispatchCtx);

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


    function onEdit() {
        eventDispatch({ ty: "selectEdit", event: event as any as Event.DiceEvent });
    }

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
            <UI.FlexRow style={{ minHeight: "1rem" }} floatRight={canModify}>
                <humanTime.Since date={Event.timeOf(event)} />
                {event.edit &&
                    <Text.Small>
                        &nbsp;(edited {humanTime.since(new Date(event.edit))})
                    </Text.Small>}
                {canModify && (
                    <ActionsRow event={event}>
                        <Button.Minor onClick={onEdit}>
                            edit
                        </Button.Minor>
                    </ActionsRow>
                )}
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}

export const Initiative = React.memo<Props>(React.forwardRef(InitiativeRecord));
