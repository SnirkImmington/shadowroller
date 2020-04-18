// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components/macro';

import * as UI from 'style';

import RollResult from 'roll/result';

/*
// The roll animations are non-random to save a few computing cycles and maybe
// let people guess what number is gonna show.
const ROLL_LISTS = [
    [6, 4, 1, 3, 2, 1],
    [2, 5, 3, 1, 6, 2],
    [6, 4, 2, 1, 5, 3],
    [4, 1, 6, 5, 3, 4],
    [3, 6, 4, 2, 1, 5],
    [3, 4, 2, 5, 1, 6]
];

const ROLL_CONFIG_BASE = {
    mass: 10, tension: 9001, friction: 500
};

type DieColorOptions = {
    negativeTwo: bool,
    positiveFour: bool,
    emphasizeSix: bool
}
*/

type DieProps = { roll: number };
export const Die: StyledComponent<DieProps> = styled.b`
    font-weight: 900;
    ${({roll}) =>
        `color: ${
            roll === 1 ? '#811111c0' :
            roll === 5 || roll === 6 ? '#4d703ec0' :
            '#2e2e32c0'
        };`
    }
    &::after {
        ${({roll}) =>
            `content: '${String.fromCharCode(0x267F + roll)}';`}
    }

    font-size: 8vw;
    @media all and (min-width: 768px) {
        font-size: 2.2em;
    }
`;

const ListWrapper: StyledComponent<> = styled(UI.FlexRow)`
    max-width: 100%;
    overflow-x: hidden;
    overflow-y: auto;
`;

type Props = { +showNumbers?: bool, +dice: number[] };
export default function RollingDice(props: Props) {
    const dice = props.dice.map((die, ix) =>
        <Die key={ix} roll={die} />
    );

    const result = new RollResult(props.dice);
    const displayMessage = props.showNumbers || result.isGlitched();

    return (
        <ListWrapper>
            <span style={{lineHeight: 1.2, overflow: 'hidden'}}>
                {dice}
            </span>
            <span className="roll-explain-text col-auto my-auto">
                <b className="">
                    {displayMessage ? result.toString() : ''}
                </b>
            </span>
        </ListWrapper>
    );
}
