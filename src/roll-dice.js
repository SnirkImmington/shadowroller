// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as style from 'style';

import type { Game } from 'game/state';
import type { EventDispatch } from 'event/state';
import NumericInput from 'components/numeric-input';
import { postRoll } from 'server';
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
    +dispatch: EventDispatch;
    +game: Game;
};
export default function RollDicePrompt({ game, dispatch }: Props) {
    const [diceCount, setDiceCount] = React.useState<?number>(null);
    const [rollLoading, setRollLoading] = React.useState(false);

    const rollDisabled = (
        rollLoading || !diceCount || diceCount < 1 || diceCount > 100
    );

    function onRollClicked() {
        if (!diceCount) { return; }
        if (!game || !game.connected) {
            const dice = roll(diceCount);
            dispatch({
                ty: "localRoll", dice, id: 0
            });
        }
        else {
            setRollLoading(true);
            postRoll(diceCount)
                .then(res => {
                    setRollLoading(false);
                })
                .catch(err => {
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
