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

const FormRow = styled.div`
    margin: .5em 0px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
`;

const RollInputRow = styled(FormRow)`
    flex-wrap: nowrap;
    justify-content: flex-around;
`

const TitleRow = styled(FormRow)`
    justify-content: space-between;
`;

const FormLabel = styled.label`
    margin: auto 5px;
    /*margin-right: 0.5em;*/
    /*flex-basis: 0;*/
`;

const RollButton = styled(UI.Button)`
    background-image: linear-gradient(180deg, #337ab7 0, #3688c8);
    font-size: 1.05em;
    font-weight: 500;
    padding: .3rem .7rem;
`;


type Props = {
    +connection: server.Connection;
    +dispatch: Event.Dispatch;
};
export default function RollDicePrompt({ connection, dispatch }: Props) {
    const [diceCount, setDiceCount] = React.useState<?number>(null);
    const [rollLoading, setRollLoading] = React.useState(false);

    const rollDisabled = (
        rollLoading || !diceCount || diceCount < 1 || diceCount > 100
    );

    function onRollClicked(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        if (!diceCount) { return; }
        if (connection !== "connected") {
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
        <UI.Card color="lightseagreen">
            <TitleRow>
                <span>Roll Dice</span>
                <span>Local roll???</span>
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
            <FormRow>
                <FormLabel htmlFor="roll-submit">
                    flavortext!
                </FormLabel>
                <button className="btn btn-primary">Roll btn</button>
                <RollButton className="btn">Roll dice</RollButton>
                <RollButton id="roll-button-submit" type="submit"
                            disabled={rollDisabled}
                            onClick={onRollClicked}>
                    Roll dice
                </RollButton>
            </FormRow>
            </form>
        </UI.Card>
    );
}
