// @flow

import React from 'react';

import RollRecord from './roll-record';
import SortedDiceList from './sorted-dice-list';

import '../roll-menu.css';

import RollResult from '../result/roll-result';
import RollAgainstResult from '../result/roll-against';

type RollAgainstProps = {
    recordKey: any,
    outcome: RollAgainstResult,
    onClose: (number) => void;
}

export default function RollAgainstRecord(props: RollAgainstProps) {
    const outcome = props.outcome;
    const userResult = outcome.userRoll;
    const foeResult = outcome.foeRoll;

    let alertStyle = "success"
    if (outcome.successful()) {
        if (userResult.isGlitched()) {
            alertStyle = (userResult.isCrit() ? "danger" : "warning");
        }
    }
    else {
        alertStyle = "warning";
    }

    const status = (outcome.successful() ? "Success" : "Failure");
    const hitDiff = outcome.netHits();

    let message;
    if (outcome.successful()) {
        message = (
            <span className="roll-record-message">
                <b>{"Success!"}</b>
                <b>{" " + hitDiff}</b>{" net hits."}
            </span>
        );
    }
    else {
        message = (
            <span className="roll-record-message">
                <b>{"Failure! "}</b>
                behind by
                <b>{" " + -hitDiff}</b>{" net hits."}
            </span>
        );
    }

    const userRolls = [];
    const foeRolls = [];
    userRolls.push(...userResult.dice);
    foeRolls.push(...foeResult.dice);

    const tooltip = (
        <span>
            <p>User rolling{" " + userRolls.length+" "}dice:</p>
            <SortedDiceList rolls={userRolls} />
            <p>Foe rolling{" " + foeRolls.length+" "}dice:</p>
            <SortedDiceList rolls={foeRolls} />
        </span>
    );

    return (
        <RollRecord className="roll-against-record"
                    label="Opposed"
                    recordKey={props.recordKey}
                    mode={alertStyle}
                    onClose={props.onClose}
                    message={message}
                    tooltip={tooltip} />
    );
}
