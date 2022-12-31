import * as React from 'react';
import { ThemeContext } from 'styled-components/macro';

import * as UI from 'style';
import * as icons from 'style/icon';
import { Record } from "record";
import NumericInput from "component/NumericInput";
import type { Selector, InvalidState } from "component/NumericInput";
import Checkbox from "component/Checkbox";
import FormStatus from "component/FormStatus";
import GlitchyInput from "roll/component/GlitchyInput";
import Input from "component/Input";
import * as Button from "component/Button";
import DeleteConfirm from "component/DeleteConfirm";

import * as Event from 'event';
import * as Share from 'share';
import { SetEditEventCtx } from 'history/EditingState';
import * as colorUtil from 'colorUtil';

type Props = {
    event: Event.DiceEvent,
    playerID: string | null,
    hue: number | null | undefined,
    noActions?: boolean,
    onEdit?: () => void,
};

export default function EditDiceRoll({ event, playerID, hue }: Props) {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const eventCmdDispatch = React.useContext(Event.CmdCtx);
    const setEdit = React.useContext(SetEditEventCtx);
    const theme = React.useContext(ThemeContext);

    const [title, setTitle] = React.useState(event.title);
    const [ty, setTy] = React.useState(event.ty);
    const [prepushed, setPrepushed] = React.useState(event.ty === "edgeRoll");
    const [rerolled, setRerolled] = React.useState(event.ty === "rerollFailures");
    const [glitchy, setGlitchy] = React.useState(event.glitchy);
    const [loading, setLoading] = React.useState(false);
    const [deleteReady, setDeleteReady] = React.useState(false);

    const color = colorUtil.playerColor(hue, theme);
    const messages = [];
    const diff: Partial<Event.DiceEvent> = {};

    // Could pre-trim title for the check here but not worth it
    if (title.length > 128) {
        messages.push("Title too long");
    } else if (title !== event.title) {
        diff.title = title.trim();
    }

    if (glitchy !== event.glitchy) {
        diff.glitchy = glitchy;
    }

    const changes = Object.keys(diff);
    // @ts-ignore we will need an actual merge algorithm since type might change
    const newEvent: Event.DiceEvent = { ...event, ...diff };

    function onGlitchySelect(value: number | InvalidState) {
        if (typeof value === "number") {
            setGlitchy(value);
        }
    }

    function handleTitle(e: React.ChangeEvent<HTMLInputElement>) {
        setTitle(e.target.value);
    }

    function handleDelete() {
        eventCmdDispatch({ ty: "del", id: event.id });
        setEdit(null);
    }

    function handleSave() {
        if (messages.length > 0 || changes.length === 0) {
            return;
        }
        eventCmdDispatch({ ty: "edit", id: event.id, diff }, setLoading);
        setEdit(null);
    }

    const handleCancel = React.useCallback(function handleCancel() {
        setEdit(null);
    }, [setEdit]);

    return (
        <UI.FlexColumn>
            <Record event={newEvent} playerID={playerID} hue={hue} noActions />
            <UI.FlexRow formRow style={{ marginTop: "0.5rem" }}>
                <i>Editing dice rolls is still WIP. Only the title and glitchy can be changed.</i>
            </UI.FlexRow>
            <UI.FlexRow flexWrap formRow style={{ marginTop: "0.5rem" }}>
                Roll
                <NumericInput id={`edit-${event.id}-set-dice`} min={0} max={99} disabled onSelect={() => { }}
                    placeholder={(event.ty === "roll" ? event.dice.length : event.rounds[0].length).toString()} />
                dice to
                <Input id={`edit-${event.id}-set-title`} placeholder={event.title}
                    value={title} onChange={handleTitle} />
            </UI.FlexRow>
            <UI.FlexRow formRow flexWrap spaced>
                <Checkbox id={`edit-${event.id}-set-push-limit`} disabled
                    checked={prepushed} onChange={() => { }}>
                    <UI.TextWithIcon color={color}>
                        <UI.FAIcon transform="grow-2" className="icon-inline" icon={icons.faBolt} />
                        Push the limit (on roll)
                    </UI.TextWithIcon>
                </Checkbox>
            </UI.FlexRow>
            <UI.FlexRow flexWrap spaced floatRight>
                <DeleteConfirm id={`edit-${event.id}`} onDelete={handleDelete}
                    ready={deleteReady} setReady={setDeleteReady} />
                <GlitchyInput baseID="edit-event" color={color} glitchy={glitchy}
                    setGlitchy={setGlitchy} onGlitchySelect={onGlitchySelect} />
                <UI.FlexRow formRow spaced>
                    <FormStatus messages={messages} changes={changes.length} />
                    <Button.Minor id={`edit-${event.id}-save`} onClick={handleSave}
                        disabled={changes.length === 0 || messages.length !== 0 || loading}>
                        save
                    </Button.Minor>
                    <Button.Minor onClick={handleCancel}>
                        cancel
                    </Button.Minor>
                </UI.FlexRow>
            </UI.FlexRow>
            {/* Undoing post-push would go here. */}
        </UI.FlexColumn>
    );
}
