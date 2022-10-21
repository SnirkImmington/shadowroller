import * as React from 'react';
import * as UI from 'style';
import EventRecord from "record/EventRecord";
import NumericInput from "component/NumericInput";
import type { Selector, InvalidState } from "component/NumericInput";
import Checkbox from "component/Checkbox";
import Input from "component/Input";

import * as Event from 'event';
import * as Share from 'share';
import DeleteConfirm from "component/DeleteConfirm";
import { SetEditEventCtx } from 'history/EditingState';

type Props = {
    event: Event.DiceEvent,
    playerID: string | null,
    hue: number | null | undefined,
    noActions?: boolean,
    onEdit?: () => void,
};

function EditingRollRecord({ event, playerID, hue }: Props, ref: React.Ref<HTMLDivElement>) {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const eventCmdDispatch = React.useContext(Event.CmdCtx);
    const setEdit = React.useContext(SetEditEventCtx);

    const [title, setTitle] = React.useState(event.title);
    const [ty, setTy] = React.useState(event.ty);
    const [prepushed, setPrepushed] = React.useState(event.ty === "edgeRoll");
    const [rerolled, setRerolled] = React.useState(event.ty === "rerollFailures");
    const [glitchy, setGlitchy] = React.useState(event.glitchy);
    const [deleteReady, setDeleteReady] = React.useState(false);

    function handleDelete() {
        eventCmdDispatch({ ty: "del", id: event.id });
        setEdit(null);
    }

    function handleGlitchy() {
        setGlitchy(g => g === 0 ? 1 : 0);
    }

    const newEvent = event;
    return (
        <UI.FlexColumn ref={ref}>
            <EventRecord event={newEvent} playerID={playerID} hue={hue} noActions />
            <UI.FlexRow flexWrap formRow style={{ marginTop: "0.5rem" }}>
                Roll
                <NumericInput id={`edit-${event.id}-set-dice`} min={0} max={99} disabled onSelect={() => { }}
                    placeholder={(event.ty === "roll" ? event.dice.length : event.rounds[0].length).toString()} />
                dice to
                <Input id={`edit-${event.id}-set-title`} />
                {/* TODO sharing info here. */}
            </UI.FlexRow>
            <UI.FlexRow formRow flexWrap spaced>
                <Checkbox id={`edit-${event.id}-set-push-limit`} disabled
                    checked={prepushed} onChange={() => { }}>
                    Push the limit (when rolled)
                </Checkbox>
                <Checkbox id={`edit-${event.id}-set-reroll`} disabled
                    checked={rerolled} onChange={() => { }}>
                    Reroll failures
                </Checkbox>
            </UI.FlexRow>
            <UI.FlexRow formRow flexWrap spaced>
                <DeleteConfirm id={`edit-${event.id}`} onDelete={handleDelete}
                    ready={deleteReady} setReady={setDeleteReady} />
                <Checkbox id={`edit-${event.id}-enable-glitchy`}
                    checked={glitchy > 0} onChange={handleGlitchy}>
                    Glitchy
                </Checkbox>
            </UI.FlexRow>
            {/* Undoing post-push would go here. */}
        </UI.FlexColumn>
    );
}

export default React.memo<Props>(React.forwardRef(EditingRollRecord));
