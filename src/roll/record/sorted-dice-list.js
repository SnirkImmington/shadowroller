// @flow

import React, { Component } from 'react';
import '../roll-menu.css';

export default function SortedDiceList(props: { rolls: number[] }) {
        props.rolls.sort((a, b) => b - a);
        const withEmphasis = props.rolls.map(roll => {
            roll = parseInt(roll, 10);
            if (roll >= 5 || roll === 1) {
                return "[" + roll + "]";
            }
            else {
                return " " + roll + " ";
            }
        })
        return (
            <p className='sorted-dice-list'>
                {withEmphasis.join(" ")}
            </p>
        );
}
