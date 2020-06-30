// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';

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

type DieProps = { roll: number };
export const Die = React.memo<DieProps>(function Die({ roll }: DieProps) {
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

    return <Dice className="sr-die" color={color} />;
});

const ListWrapper: StyledComponent<> = styled(UI.FlexRow)`
`;

type ListProps = { rolls: number[] };
export function List({ rolls }: ListProps) {
    const dice = rolls.map((roll, ix) =>
        <Die key={ix * 10 + roll} roll={roll} />
    );
    return <ListWrapper>{dice}</ListWrapper>;
}
