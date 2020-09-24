// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import NumericInput from 'numeric-input';
import {EventRecord} from 'history-panel';

import * as Event from 'event';
import * as Game from 'game';

const TitleBar = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

export default function EditEvent() {
    const game = React.useContext(Game.Ctx);
    const source = game?.gameID ? { id: game.player.id, name: game.player.name } : "local";

    const [title, setTitle] = React.useState("heroes never die");
    return (
        <UI.Card color="#81132a">
            <TitleBar>
                <UI.CardTitleText color="#842222">
                    Edit roll
                </UI.CardTitleText>
                <UI.LinkButton>[ X ]</UI.LinkButton>
            </TitleBar>
            <UI.FlexColumn>
                <UI.FlexRow maxWidth style={{marginBottom: "1rem"}}>
                    <EventRecord eventIx={0} noActions style={{
                            flexGrow: 1,
                        }} event={{
                        ty: "roll", id: 69,
                        source: source,
                        dice: [1, 5, 4, 3, 2, 6, 2, 5],
                        title: title,
                    }} />
                </UI.FlexRow>
                <UI.FlexRow maxWidth style={{marginBottom:".5rem"}}>
                    Title
                    <UI.Input placeholder="do a barrel roll" onChange={(e) => setTitle(e.target.value)} />
                </UI.FlexRow>
                <UI.FlexRow style={{whiteSpace: 'nowrap'}}>
                    Pool:
                    <NumericInput placeholder="9" id="edit-event-dice-pool" onSelect={()=>{}} />
                    (<UI.LinkButton monospace>+2</UI.LinkButton>
                    <UI.LinkButton monospace>+1</UI.LinkButton>
                    <UI.LinkButton monospace>-1</UI.LinkButton>
                    <UI.LinkButton monospace>-2</UI.LinkButton>)
                    Dice are removed from the end
                </UI.FlexRow>
                <UI.FlexRow>
                    &nbsp;
                </UI.FlexRow>
                <UI.FlexRow>
                    <UI.LinkButton>delete</UI.LinkButton>
                    <span style={{flexGrow: 1}} />
                    <UI.LinkButton>update</UI.LinkButton>
                    <UI.LinkButton>cancel</UI.LinkButton>
                </UI.FlexRow>
            </UI.FlexColumn>
        </UI.Card>
    )
}
