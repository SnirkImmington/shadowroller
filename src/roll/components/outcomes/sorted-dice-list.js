// @flow

import './sorted-dice-list.css';

import React from 'react';

const DICE_CHARS: string[] = [
    "", "⚀", "⚁", "⚁", "⚃", "⚄", "⚅"
];

export default function SortedDiceList(props: { rolls: number[] }) {
    var ix = 0;
    const withEmphasis = props.rolls.map(roll => {
        ix += 1;
        roll = parseInt(roll, 10);
        const die = DICE_CHARS[roll];
        let className;
        switch (roll) {
            case 6:
                className = "text-success";
                break;
            case 5:
                className = "text-info";
                break;
            case 1:
                className = "";
                break;
            default:
                className = "text-secondary";
                break;
        }
        return (
            <span className={className}>{die}</span>
        );
    });
    return (
        <p className='sorted-dice-list'>
            {withEmphasis}
        </p>
    );
}
