// @flow

import * as React from 'react';

import RollResult from 'roll/result';

import './rolling-dice.css';
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

type Props = {
    dice: Array<number>,
    showNumbers: bool
}

export default function RollingDice(props: Props) {
    const dice = props.dice.map((die, ix) => {
        // Unicode character for die result, they start at 0x2680 for 1
        let dieText = String.fromCharCode(0x267F + die);
        let className;
        switch (die) {
            case 1:
                className = "die-icon die-glitch";
                break;
            case 5:
            case 6:
                className = "die-icon die-hit";
                break;
            default:
                className = "die-icon die-default text-muted"
        }
        return (
            <span key={ix} className={className}>{dieText}</span>
        )
    });

    const result = new RollResult(props.dice);
    const displayMessage = props.showNumbers || result.isGlitched();

    return (
        <span className="rolling-dice-group row">
            <span className="col-auto">
                {dice}
            </span>
            <span className="roll-explain-text col-auto my-auto">
                <b className="">
                    {displayMessage ? result.toString() : ''}
                </b>
            </span>
        </span>
    );
}
