// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import * as Event from 'event';

import NumericInput from 'components/numeric-input';
import * as server from 'server';
import { roll } from 'srutil';

const ButtonRow = styled(UI.FlexRow)`
    margin: .75rem .5rem;
    justify-content: flex-end;
`;

const RollInputRow = styled(UI.FlexRow)`
    margin: .75rem .5rem;
`;

const TitleRow = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

const FormLabel = styled.label`
    margin: auto 5px;
    /*margin-right: 0.5em;*/
    /*flex-basis: 0;*/
`;

const RollButton = styled(UI.Button)`
    background-image: linear-gradient(180deg, #52605e 0, #3f4946);
    font-size: 1.05em;
    color: #ccc;
    font-weight: 600;
    padding: .3rem .7rem;

    & :not(:disabled) {
        background-image: linear-gradient(180deg, #394341 0, #232928);
        color: white;
    }
`;

type Props = {
    +connection: server.Connection;
    +dispatch: Event.Dispatch;
};
export default function RollDicePrompt({ connection, dispatch }: Props) {
    const [diceCount, setDiceCount] = React.useState<?number>(null);
    const [rollLoading, setRollLoading] = React.useState(false);
    const [localRoll, setLocalRoll] = React.useState(false);

    const rollDisabled = (
        rollLoading || !diceCount || diceCount < 1 || diceCount > 100
    );

    function rollLocalClicked(event: SyntheticInputEvent<HTMLInputElement>) {
        setLocalRoll(prev => !prev);
    }

    function onRollClicked(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        if (!diceCount) { return; }
        if (localRoll || connection !== "connected") {
            const dice = roll(diceCount);
            dispatch({
                ty: "localRoll", dice
            });
        }
        else {
            setRollLoading(true);
            server.postRoll(diceCount)
                .then(res => {
                    setRollLoading(false);
                })
                .catch((err: mixed) => {
                    console.log("Error rolling:", err);
                    setRollLoading(false);
                });
        }
    }

    // roll title gets game state, dispatch useLocalRoll
    return (
        <UI.Card color="#81132a">
            <TitleRow>
                <UI.CardTitleText color="#81132a">Roll Dice</UI.CardTitleText>
                <UI.FlexRow>
                <input type="checkbox" id="toggle-local-roll"
                       checked={localRoll} onChange={rollLocalClicked} />
                <label htmlFor="toggle-local-roll" style={{marginBottom: 0, marginLeft: ".25em"}}>
                    Roll locally
                </label>
                </UI.FlexRow>
            </TitleRow>
            <form id="dice-input" onSubmit={onRollClicked}>
            <RollInputRow>
                <FormLabel htmlFor="roll-select-dice">
                    Roll
                </FormLabel>
                <NumericInput controlId="roll-select-dice"
                              min={1} max={99}
                              onSelect={setDiceCount} />
                <FormLabel htmlFor="roll-select-dice">
                    dice
                </FormLabel>
            </RollInputRow>
            <ButtonRow>
                <RollButton id="roll-button-submit" type="submit"
                            disabled={rollDisabled}
                            onClick={onRollClicked}>
                    Roll dice
                </RollButton>
            </ButtonRow>
            </form>
        </UI.Card>
    );
}
