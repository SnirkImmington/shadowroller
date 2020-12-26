// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';
import 'index.css';

import * as srutil from 'srutil';

// flow-ignore-all-next-line Uh it's there
import { ReactComponent as DieOne } from 'assets/die-1.svg';
// flow-ignore-all-next-line Uh it's there
import { ReactComponent as DieTwo } from 'assets/die-2.svg';
// flow-ignore-all-next-line Uh it's there
import { ReactComponent as DieThree } from 'assets/die-3.svg';
// flow-ignore-all-next-line Uh it's there
import { ReactComponent as DieFour } from 'assets/die-4.svg';
// flow-ignore-all-next-line Uh it's there
import { ReactComponent as DieFive } from 'assets/die-5.svg';
// flow-ignore-all-next-line Uh it's there
import { ReactComponent as DieSix } from 'assets/die-6.svg';

export function colorForRoll(roll: number): string {
    return roll === 1 ? theme.colors.dieOne
        : roll === 5 || roll === 6 ? theme.colors.dieHit
        : theme.colors.dieNone;
}

const DiceMap = [DieOne, DieOne, DieTwo, DieThree, DieFour, DieFive, DieSix];

type DieProps = {| roll: number, style?: any, ...AnimatedProps |};
export const Die = React.memo<DieProps>(function Die(props: DieProps) {
    const { color: dieColor, roll, small } = props;
    let color = dieColor;
    if (!color && !small) {
        switch (roll) {
            case 1:
                color = theme.colors.dieOne;
                break;
            case 5:
            case 6:
                color = theme.colors.dieHit;
                break;
            default:
                color = theme.colors.dieNone;
        }
    }
    else if (!color && small) {
        color = theme.colors.dieNone;
    }

    let Dice = DiceMap[roll] || DieOne;

    return <Dice className="sr-die" {...props} />;
});

type AnimatedProps = {| small?: bool, color?: string, unpadded?: bool |};
export function AnimatedDie(props: AnimatedProps) {
    const { color, small } = props;
    const [die, setDie] = React.useState<number>(srutil.rollDie);

    React.useEffect(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion)').matches;
        if (reducedMotion === "prefers-reduced-motion") {
            return;
        }
        const interval = setInterval(function() {
            setDie(srutil.rollDie());
        }, 25 * 1000);
        return () => clearInterval(interval);
    }, []);

    return <Die style={{ margin: 0 }} roll={die} {...props} />;
}

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
