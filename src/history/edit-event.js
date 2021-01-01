// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import NumericInput from 'numeric-input';
import {EventRecord} from 'history/history-panel';
import { ROLL_TITLE_FLAVOR } from 'roll-dice';

import * as Event from 'history/event';
import routes from 'routes';
import theme from 'style/theme';
import * as srutil from 'srutil';

type Props = {
    +event: Event.DiceEvent,
    +playerID: ?string,
};
export default function EditEvent({ event, playerID }: Props) {
    const dispatch = React.useContext(Event.DispatchCtx);

    const [title, setTitle] = React.useState(event.title);
    // const [dice, setDice] = React.useState(event.dice);
    const [glitchy, setGlitchy] = React.useState(event.glitchy);
    const [titleFlavor] = srutil.useFlavor(ROLL_TITLE_FLAVOR);
    const [deletePrompt, setDeletePrompt] = React.useState(false);

    const canUpdate = title !== event.title || glitchy !== event.glitchy;

    function cancelEdit() {
        dispatch({ ty: "clearEdit" });
    }

    function deleteEvent() {
        if (event.source !== "local") {
            routes.game.deleteEvent({ id: event.id })
                .onDone(success => {
                    if (success) {
                        dispatch({ ty: "clearEdit" });
                    }
                    else {
                    }
                })
        }
        else {
            dispatch({ ty: "deleteEvent", id: event.id });
            dispatch({ ty: "clearEdit" });
        }
    }

    function setRollGlitchy(selected: ?number) {
        selected != null && setGlitchy(selected);
    }

    function updateEvent() {
        if (!canUpdate) {
            return;
        }
        const diff = {};
        if (title !== event.title) { diff.title = title; }
        if (glitchy !== event.glitchy) { diff.glitchy = glitchy; }
        if (event.source !== "local") {
            routes.game.modifyRoll({ id: event.id, diff })
                .onDone(success => {
                    if (success) {
                        dispatch({ ty: "clearEdit" });
                    }
                    else {

                    }
                });
        }
        else {
            dispatch({
                ty: "modifyRoll",
                id: event.id,
                edit: new Date().valueOf(),
                diff
            });
            dispatch({ ty: "clearEdit" });
        }
    }

    return (
        <UI.Card padRight bottomGap color={theme.colors.primary}>
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>
                    Edit {event.title ? `"${event.title}"` : Event.titleOf(event)}
                </UI.CardTitleText>
                <UI.LinkButton minor onClick={cancelEdit}>close</UI.LinkButton>
            </UI.FlexRow>
            <UI.FlexColumn>
                <UI.FlexRow maxWidth formRow>
                    <EventRecord editing noActions setHeight={()=>{}}
                                 style={{ width: '100%'}} playerID={playerID}
                                 event={{ ...event, title, glitchy }} />
                </UI.FlexRow>
                <UI.ColumnToRow>
                    <UI.FlexRow formRow>
                        Roll to
                        <UI.Input
                                placeholder={event.title || titleFlavor}
                                onChange={(e) => setTitle(e.target.value)} />
                    </UI.FlexRow>
                    <UI.FlexRow formRow>
                        Glitchy
                        <NumericInput small id="edit-set-roll-glitchiness"
                                      min={-99} max={99}
                                      placeholder={`${glitchy}`}
                                      onSelect={setRollGlitchy} />
                    </UI.FlexRow>
            {/*
                    <UI.FlexRow formRow spaced>
                        Dice pool
                        <NumericInput id="edit-event-dice-pool" max={99} min={1}
                                      placeholder="9" onSelect={setNewPool} />
                        <UI.LinkButton>-2</UI.LinkButton>
                        <UI.LinkButton>-1</UI.LinkButton>
                        <UI.LinkButton>+1</UI.LinkButton>
                        <UI.LinkButton>+2</UI.LinkButton>
                    </UI.FlexRow>
            */}
                </UI.ColumnToRow>
            {/*
                <UI.FlexRow formRow>
                    <i>
                        Removing dice from the pool removes them from the right.
                    </i>
                </UI.FlexRow>
            */}
                <UI.FlexRow spaced>
                    <UI.LinkButton onClick={() => setDeletePrompt(p => !p)}>
                        delete
                    </UI.LinkButton>
                    {deletePrompt && (
                        <UI.FlexRow>
                            <i>You sure?</i>&nbsp;
                            <UI.LinkButton onClick={deleteEvent}>
                                [ yes ]
                            </UI.LinkButton>
                            &nbsp;/&nbsp;
                            <UI.LinkButton onClick={() => setDeletePrompt(false)}>
                                no
                            </UI.LinkButton>
                        </UI.FlexRow>
                    )}
                    <span style={{flexGrow: 1}} />
                    <UI.LinkButton disabled={!canUpdate} onClick={updateEvent}>
                        update
                    </UI.LinkButton>
                    <UI.LinkButton minor onClick={cancelEdit}>
                        cancel
                    </UI.LinkButton>
                </UI.FlexRow>
            </UI.FlexColumn>
        </UI.Card>
    )
}