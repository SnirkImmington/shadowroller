// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components/macro';

import * as UI from 'style';
import theme from 'style/theme';
import * as icons from 'style/icon';

import { ReactComponent as DieOne } from 'assets/die-1.svg';
import { ReactComponent as DieTwo } from 'assets/die-2.svg';
import { ReactComponent as DieThree } from 'assets/die-3.svg';
import { ReactComponent as DieFour } from 'assets/die-4.svg';
import { ReactComponent as DieFive } from 'assets/die-5.svg';
import { ReactComponent as DieSix } from 'assets/die-6.svg';

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
    line-height: 1;
    font-weight: 900;
    font-family: "source-code-pro";
    ${({roll, theme}) =>
        `color: ${
            roll === 1 ? theme.colors.dieOne :
            roll === 5 || roll === 6 ? theme.colors.dieHit :
            theme.colors.dieNone
        };`
    }

    font-size: 10vw;
    @media all and (min-width: 768px) {
        font-size: 3.8rem;
    }
`;

const colorForRoll = (roll) =>
            roll === 1 ? theme.colors.dieOne :
            roll === 5 || roll === 6 ? theme.colors.dieHit :
            theme.colors.dieNone;

export function SRDie({roll}: {roll:number}) {
    let Die = DieOne;
    let color = theme.colors.dieNone;

    switch (roll) {
        case 1: color = theme.colors.dieOne; break;
        case 2: Die = DieTwo; break;
        case 3: Die = DieThree; break;
        case 4: Die = DieFour; break;
        case 5: Die =DieFive; color = theme.colors.dieHit; break;
        case 6: Die = DieSix; color = theme.colors.dieHit; break;
        default:
            break;
    }

    return <Die className="sr-die" width="32px" height="32px" color={color} />;
}

export function SRDice(props: Props) {
    const style = {
        fontSize: '20px',
        height: '30px',
        width: '30px',
        margin: props.dice.length <= 12 ? '2px' : '2px 2px 4px',
        flexShrink: '0',
    }
    const dice = props.dice.map((die, ix) => (
        <SRDie style={{color: colorForRoll(die), ...style}} roll={die} key={ix} />
    ));

    return <ListWrapper>{dice}</ListWrapper>;
}

function iconForRoll(roll: number): any {
    switch (roll) {
        case 1: return icons.faDiceOne;
        case 2: return icons.faDiceTwo;
        case 3: return icons.faDiceThree;
        case 4: return icons.faDiceFour;
        case 5: return icons.faDiceFive;
        case 6: return icons.faDiceSix;
        default: return null;
    }
}

const DieSpan: StyledComponent<> = styled.span`
    font-size: 8vw;
    height: 1em;
    width: 1em;

    @media all and (min-width: 768px) {
        font-size: 36px;
    }
`;

export function FADie({roll}: {roll: number}) {
    const color = roll === 1 ? theme.colors.dieOne :
            roll === 5 || roll === 6 ? theme.colors.dieHit :
            theme.colors.dieNone;
    return <DieSpan>
        <UI.FAIcon color={color} icon={iconForRoll(roll)} />
    </DieSpan>
}

const ListWrapper: StyledComponent<> = styled(UI.FlexRow)`
    width: 100%;
    line-height: 1;

    overflow-x: auto; /* left-right overflow */
    overflow-y: hidden; /* up-down overflow */

    /* Scrollbars!
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
    */
`;

type Props = { +dice: number[] };
export default function RollingDice(props: Props) {
    const dice = props.dice.map((die, ix) =>
        <Die key={ix} roll={die}>{String.fromCharCode(0x267F + die)}</Die>
    );

    return (
        <ListWrapper>
                {dice}
        </ListWrapper>
    );
}

export function FADice(props: Props) {
    const dice = props.dice.map((die, ix) =>
        <FADie key={ix} roll={die} />
    );
    return <ListWrapper>{dice}</ListWrapper>
}
