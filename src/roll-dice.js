// @flow

import * as React from 'react';
import styled from 'styled-components/macro';

import { AppWideBox, Button } from 'style';
import NumericInput from 'components/numeric-input';

const Prompt = styled(AppWideBox)`
    border-top: 4px solid #0b0ba3;

    display: flex;
    flex-direction: column;
`;

const Form = styled.div`
    display: flex;
    flex-direction: column;
`;

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

};
export default function RollDicePrompt(props: Props) {
    // roll title gets game state, dispatch useLocalRoll
    return (
        <Prompt>
            <TitleRow>
                <span>Roll Dice</span>
                <span>Local roll???</span>
            </TitleRow>
            <RollInputRow>
                <FormLabel htmlFor="roll-select-dice">
                    Roll
                </FormLabel>
                <NumericInput controlId="roll-select-dice" onSelect={() => {}} />
                <FormLabel htmlFor="roll-select-dice">
                    dice
                </FormLabel>
            </RollInputRow>
            <FormRow>
                <FormLabel htmlFor="roll-submit">
                    flavortext!
                </FormLabel>
                <RollButton id="roll-button-submit">
                    Roll dice
                </RollButton>
            </FormRow>
        </Prompt>
    );
}
