import * as React from 'react';
import styled, { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as Button from 'component/Button';
import * as Space from 'component/Space';
import * as layout from 'layout';
import NumericInput from 'component/NumericInput';
import EventRecord from 'history/EventRecord';
import { ROLL_TITLE_FLAVOR } from 'DiceRollMenu';

import * as Event from 'event';
import * as Player from 'player';
import * as routes from 'routes';
import * as icons from 'style/icon';
import * as srutil from 'srutil';

const MenuPadding = styled.div({
    padding: `0 ${layout.Space.Small} 0.75rem ${layout.Space.Small}`,
    [layout.Media.Columns]: {
        padding: `0 ${layout.Space.Small} 0.75rem 0`,
    }
});

const WrappingText = styled.span({
    whiteSpace: "normal"
});

type Props = {
    event: Event.DiceEvent,
};
export default function EditEventMenu({ event }: Props) {
    const player = React.useContext(Player.Ctx);
    const dispatch = React.useContext(Event.DispatchCtx);
    const theme = React.useContext(ThemeContext);

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

    function setRollGlitchy(selected: number | null) {
        selected != null && setGlitchy(selected);
    }

    function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!canUpdate) {
            return;
        }
        const diff: Partial<Event.Roll> = {};
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
                ty: "modifyEvent",
                id: event.id,
                edit: new Date().valueOf(),
                diff
            });
            dispatch({ ty: "clearEdit" });
        }
    }

    return (
        <MenuPadding>
        <UI.Card color={theme.colors.primary}>
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>
                    <UI.FAIcon icon={icons.faPen} />
                    Edit <WrappingText>
                        {event.title ? `"${event.title}"` : Event.titleOf(event)}
                    </WrappingText>
                </UI.CardTitleText>
                <Button.Minor onClick={cancelEdit}>close</Button.Minor>
            </UI.FlexRow>
            <form id="edit-roll-form" onSubmit={onSubmit}>
                <UI.FlexColumn>
                    <UI.FlexRow maxWidth formRow>
                        <EventRecord noActions setHeight={()=>{}}
                                     style={{ width: '100%'}} playerID={player ? player.id : null}
                                     hue={player?.hue}
                                     event={{ ...event, title, glitchy }} />
                    </UI.FlexRow>
                    <UI.FlexRow flexWrap>
                        <UI.FlexRow formRow>
                            Roll to
                            <UI.Input id="edit-set-title"
                                    value={title}
                                    placeholder={titleFlavor}
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
                            <Button.Main>-2</Button.Main>
                            <Button.Main>-1</Button.Main>
                            <Button.Main>+1</Button.Main>
                            <Button.Main>+2</Button.Main>
                        </UI.FlexRow>
                */}
                    </UI.FlexRow>
                {/*
                    <UI.FlexRow formRow>
                        <i>
                            Removing dice from the pool removes them from the right.
                        </i>
                    </UI.FlexRow>
                */}
                    <UI.FlexRow spaced>
                        <Button.Main onClick={() => setDeletePrompt(p => !p)}>
                            delete
                        </Button.Main>
                        {deletePrompt && (
                            <UI.FlexRow>
                                <i>You sure?</i>&nbsp;
                                <Button.Main onClick={deleteEvent}>
                                    [ yes ]
                                </Button.Main>
                                &nbsp;/&nbsp;
                                <Button.Main onClick={() => setDeletePrompt(false)}>
                                    no
                                </Button.Main>
                            </UI.FlexRow>
                        )}
                        <Space.FlexGrow />
                        <Button.Main type="submit" disabled={!canUpdate}>
                            update
                        </Button.Main>
                        <Button.Minor onClick={cancelEdit}>
                            cancel
                        </Button.Minor>
                    </UI.FlexRow>
                </UI.FlexColumn>
            </form>
        </UI.Card>
        </MenuPadding>
    );
}
