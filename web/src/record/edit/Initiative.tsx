import * as React from "react";
import { ThemeContext } from 'styled-components/macro';

import * as UI from "style";
import * as icons from "style/icon";
import NumericInput from "component/NumericInput";
import type { InvalidState } from "component/NumericInput";
import { Record } from "record";
import DeleteConfirm from "component/DeleteConfirm";
import Checkbox from "component/Checkbox";
import Input from "component/Input";
import FormStatus from "component/FormStatus";
import * as Text from "component/Text";
import * as Button from "component/Button";

import * as Event from "event";
import * as srutil from "srutil";
import * as colorUtil from "colorUtil";
import { SetEditEventCtx } from "history/EditingState";

type Props = {
    event: Event.Initiative;
    playerID: string | null,
    hue: number | null | undefined;
};

/** A */
export default function EditInitiative({ event, playerID, hue }: Props) {
    const eventCmdDispatch = React.useContext(Event.CmdCtx);
    const setEdit = React.useContext(SetEditEventCtx);
    const theme = React.useContext(ThemeContext);

    const [title, setTitle] = React.useState(event.title);
    const [base, setBase] = React.useState<number | InvalidState>(event.base);
    // const [diceCount, setDiceCount] = React.useState<number | InvalidState>(event.dice.length);
    const [seized, toggleSeized] = srutil.useToggle(event.seized);
    const [deleteReady, setDeleteReady] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const color = colorUtil.playerColor(hue, theme);

    function handleSetTitle(e: React.ChangeEvent<HTMLInputElement>) {
        setTitle(e.target.value.trim());
    }

    function handleCancel() {
        setEdit(null);
    }

    const messages = [];
    const diff: Partial<Event.Initiative> = {};
    if (base === "error") {
        messages.push("Invalid base");
    } else if (base === "tooSmall") {
        messages.push("Base too low");
    } else if (base === "tooBig") {
        messages.push("Base too high");
    } else if (base !== "empty" && base !== event.base) {
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
    const newEvent = { ...event, ...diff };

    function handleSave() {
        if (messages.length > 0 || changes.length === 0) {
            return;
        }
        eventCmdDispatch({ ty: "edit", id: event.id, diff }, setLoading);
        setEdit(null);
    }

    function handleDelete() {
        eventCmdDispatch({ ty: "del", id: event.id }, setLoading);
    }

    return (
        <UI.FlexColumn>
            <Record event={newEvent} playerID={playerID} hue={hue} noActions />
            <UI.FlexRow formRow style={{ marginTop: "0.5rem" }}>
                <i>Editing rolls is still WIP. Dice and blitz cannot be changed yet.</i>
            </UI.FlexRow>
            <UI.FlexRow flexWrap formRow style={{ marginTop: "0.5rem" }}>
                Roll
                <NumericInput small id={`edit-${event.id}-set-base`} min={-2} max={69}
                    placeholder={event.base.toString()} onSelect={setBase} />
                +
                <NumericInput small id={`edit-${event.id}-set-dice`} disabled
                    placeholder={event.dice.length.toString()} onSelect={() => { }} />
                d6 for
                <Input id={`edit-${event.id}-set-title`}
                    placeholder={event.title || "initiative"} value={title} onChange={handleSetTitle} />
            </UI.FlexRow>
            <UI.FlexRow formRow spaced>
                <Checkbox id={`edit-${event.id}-blitz`} checked={event.blitzed} disabled onChange={() => { }}>
                    <UI.TextWithIcon color={color}>
                        <UI.FAIcon transform="grow-2" className="icon-inline" icon={icons.faBolt} />
                        Blitz
                    </UI.TextWithIcon>
                </Checkbox>
                <Checkbox id={`edit-${event.id}-seize-initiative`}
                    checked={seized} onChange={toggleSeized} disabled={event.blitzed}>
                    <UI.TextWithIcon color={color}>
                        <UI.FAIcon transform="grow-2" className="icon-inline" icon={icons.faSortAmountUp} />
                        Seize the initiative
                    </UI.TextWithIcon>
                </Checkbox>
            </UI.FlexRow>
            <UI.FlexRow formRow flexWrap spaced floatRight>
                <DeleteConfirm id={`event-${event.id}`} ready={deleteReady} setReady={setDeleteReady} onDelete={handleDelete} />
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
