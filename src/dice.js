// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';
import 'index.css';

import { ReactComponent as DieOne } from 'assets/die-1.svg';
import { ReactComponent as DieTwo } from 'assets/die-2.svg';
import { ReactComponent as DieThree } from 'assets/die-3.svg';
import { ReactComponent as DieFour } from 'assets/die-4.svg';
import { ReactComponent as DieFive } from 'assets/die-5.svg';
import { ReactComponent as DieSix } from 'assets/die-6.svg';

export function colorForRoll(roll: number): string {
    return roll === 1 ? theme.colors.dieOne
        : roll === 5 || roll === 6 ? theme.colors.dieHit
        : theme.colors.dieNone;
}

type DieProps = { roll: number, small?: bool };
export const Die = React.memo<DieProps>(function Die({ roll, small }: DieProps) {
    let Dice = DieOne;
    let color = theme.colors.dieNone;

    switch (roll) {
        case 1: color = theme.colors.dieOne; break;
        case 2: Dice = DieTwo; break;
        case 3: Dice = DieThree; break;
        case 4: Dice = DieFour; break;
        case 5: Dice =DieFive; color = theme.colors.dieHit; break;
        case 6: Dice = DieSix; color = theme.colors.dieHit; break;
        default:
            break;
    }

    return <Dice className="sr-die"
                 color={small ? theme.colors.dieNone : color} />;
});

const StyledList: StyledComponent<{ small?:bool, }> = styled(UI.FlexRow)`
    /* Mobile: dice are 1/12 screen width. */
    font-size: 7vw;

    @media all and (min-width: 768px) {
        font-size: 2.5rem;
    }
`;

const SmallStyledList: StyledComponent<> = styled(UI.FlexRow)`
    font-size: 1.2em;
    display: inline-flex;

    & > * {
        display: inline-block;
    }
`;

type ListProps = { rolls: number[], small?: bool, children?: React.ChildrenArray<any> };
export function List({ rolls, small, children }: ListProps) {
    const Wrapper = small ? SmallStyledList : StyledList;
    return (
        <Wrapper>
            {children}
            {rolls.map((roll, ix) =>
                <Die key={ix * 10 + roll} small={small} roll={roll} />
            )}
        </Wrapper>
    );
}
