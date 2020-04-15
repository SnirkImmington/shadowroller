// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as style from 'style';

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

const RollButton = styled.button`
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

    function onRollClicked() {
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
        <style.Card color="lightseagreen">
            <>
                <span>Roll Dice</span>
                <span>Local roll???</span>
            </>
            <RollInputRow>
                <FormLabel htmlFor="roll-select-dice">
                    Roll
                </FormLabel>
                <NumericInput controlId="roll-select-dice"
                              onSelect={setDiceCount} />
                <FormLabel htmlFor="roll-select-dice">
                    dice
                </FormLabel>
            </RollInputRow>
            <FormRow>
                <FormLabel htmlFor="roll-submit">
                    flavortext!
                </FormLabel>
                <RollButton id="roll-button-submit"
                            disabled={rollDisabled}
                            onClick={onRollClicked}
                            min={1} max={99} >
                    Roll dice
                </RollButton>
            </FormRow>
        </style.Card>
    );
}
