// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import {EventRecord} from 'history-panel';

import * as Event from 'event';
import routes from 'routes';

const TitleBar = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

type Props = {
    +event: Event.DiceEvent,
    +playerID: ?string,
};
export default function EditEvent({ event, playerID }: Props) {
    const dispatch = React.useContext(Event.DispatchCtx);

    const [title, setTitle] = React.useState(event.title);
    const [deletePrompt, setDeletePrompt] = React.useState(false);

    const canUpdate = title !== event.title;

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

    function updateEvent() {
        if (event.source !== "local") {
            routes.game.modifyRoll({ id: event.id, diff: { title }})
                .onDone(success => {
                    if (success) {
                        dispatch({ ty: "clearEdit" });
                    }
                    else {

                    }
                });
        }
        else {
            dispatch({ ty: "modifyRoll", id: event.id, edit: new Date().valueOf(), diff: { title } });
            dispatch({ ty: "clearEdit" });
        }
    }

    return (
        <UI.Card color="#81132a" style={{ padding: '5px'}}>
            <TitleBar>
                <UI.CardTitleText color="#842222">
                    Edit {event.title ? `"${event.title}"` : Event.titleOf(event)}
                </UI.CardTitleText>
                <UI.LinkButton onClick={cancelEdit}>[ X ]</UI.LinkButton>
            </TitleBar>
            <UI.FlexColumn>
                <UI.FlexRow maxWidth formRow>
                    <EventRecord editing noActions setHeight={()=>{}}
                                 style={{ width: '100%'}} playerID={playerID}
                                 event={{ ...event, title: title }} />
                </UI.FlexRow>
                <UI.ColumnToRow>
                    <UI.FlexRow formRow>
                        Title
                        <UI.Input
                                placeholder={event.title}
                                onChange={(e) => setTitle(e.target.value)} />
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
                    <UI.LinkButton onClick={cancelEdit}>
                        cancel
                    </UI.LinkButton>
                </UI.FlexRow>
            </UI.FlexColumn>
        </UI.Card>
    )
}
