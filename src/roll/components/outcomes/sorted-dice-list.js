// @flow

import './roll-record.css';

import React from 'react';

export default function SortedDiceList(props: { rolls: number[] }) {
    props.rolls.sort((a, b) => b - a);
    const withEmphasis = props.rolls.map(roll => {
        roll = parseInt(roll, 10);
        if (roll >= 5 || roll === 1) {
            return <b>{' ' + roll + ' '}</b>;
        }
        else {
            return " " + roll + " ";
        }
    })
    return (
        <p className='sorted-dice-list'>
            {withEmphasis}
        </p>
    );
}
