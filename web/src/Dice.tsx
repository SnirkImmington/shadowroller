import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';
import 'index.css';

import { die as rollDie } from 'roll';

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

const DiceMap = [DieOne, DieOne, DieTwo, DieThree, DieFour, DieFive, DieSix];

type AnimatedProps = {
    small?: boolean,
    color?: string,
    unpadded?: boolean
};
interface DieProps extends AnimatedProps {
    roll: number,
    style?: React.StyleHTMLAttributes<HTMLOrSVGElement> // TODO style prop
};

export const Die = React.memo<DieProps>(function Die(props: DieProps) {
    const newProps = Object.assign({}, props);
    let { color, roll, small } = newProps;
    if (!color && !small) {
        newProps.color = colorForRoll(roll);
    }
    else if (!color && small) {
        newProps.color = theme.colors.dieNone;
    }
    delete newProps.small;

    let Dice = DiceMap[roll] || DieOne;

    return <Dice className={!small ? "sr-die sr-die-padded" : "sr-die"} {...newProps} />;
});

export function AnimatedDie(props: AnimatedProps) {
    const [die, setDie] = React.useState<number>(rollDie);

    React.useEffect(() => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion)').media;
        if (reducedMotion === "prefers-reduced-motion") {
            return;
        }
        const interval = setInterval(function() {
            setDie(rollDie());
        }, 25 * 1000);
        return () => clearInterval(interval);
    }, []);

    return <Die roll={die} {...props} />; // margin: 0
}

const StyledList = styled(UI.FlexRow)`
    /* Mobile: dice are 1/12 screen width. */
    font-size: 7vw;

    @media all and (min-width: 768px) {
        font-size: 2.5rem;
    }
`;

const SmallStyledList = styled(UI.FlexRow)`
    font-size: 1.2em;
    display: inline-flex;
`;

type ListProps = {
    rolls: number[],
    small?: boolean,
};
export function List({ rolls, small, children }: React.PropsWithChildren<ListProps>) {
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
