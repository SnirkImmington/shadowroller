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
    line-height: 1em;
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
        font-size: 2.4em;
    }
`;

const ListWrapper: StyledComponent<> = styled(UI.FlexRow)`
    width: 100%;
    line-height: 1em;

    overflow-x: auto; /* left-right overflow */
    overflow-y: hidden; /* up-down overflow */

    /* Scrollbars! */
    scrollbar-width: thin;
    scrollbar-color: #81132add transparent;

    &::-webkit-scrollbar {
        height: 4px;
        width: 4px;
    }
    & ::-webkit-scrollbar-track {
        background: transparent;
    }
    & ::-webkit-scrollbar-thumb {
        background-color: teansparent;
        background: transparent;
        border-radius: 6px;
        border: 3px solid #81132add;
    }
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
                {dice}
            <b className="">
                {displayMessage ? result.toString() : ''}
            </b>
        </ListWrapper>
    );
}
