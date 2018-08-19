// @flow

import './roll-record.css';

import React from 'react';

import RollRecord from './roll-record';
import SortedDiceList from './sorted-dice-list';

import CountHitsResult from '../../result/count-hits';
import pluralize from '../../../util/pluralize';

type CountHitsRecordProps = {
    recordKey: number;
    outcome: CountHitsResult;
    onClose: (number) => void;
}

export default function CountHitsRecord(props: CountHitsRecordProps) {
    const outcome = props.outcome;
    const result = outcome.result;

    let alertStyle = "dark";
    if (result.isGlitched()) {
        alertStyle = (result.isCrit() ? "danger" : "warning");
    }
    else if (result.hits === 0) {
        alertStyle = "info";
    }
    let message;
    if (result.isGlitched() || result.hits > 0) {
        message = (
            <span className="roll-record-message">
                <b>{result.status + "! "}</b>
                <b>{result.hits}</b>{pluralize(result.hits, " hit")}.
                <SortedDiceList rolls={[...result.dice]} />
            </span>
        );
    }
    else /* result.hits === 0 */ {
        message = (
            <span className="roll-record-message">
                <b>No hits</b>, chummer.
            </span>
        )
    }

    // Deep copy of result's rolls
    const rolls: number[] = [];
    rolls.push(...result.dice);

    const tooltip = (
        <span>
            <p>Rolling{" " + result.dice.length + " "}dice:</p>
            <SortedDiceList rolls={rolls} />
        </span>
    );

    return (
        <RollRecord className="roll-hits-record"
                    label={`Count hits (${outcome.result.dice.length})`}
                    recordKey={props.recordKey}
                    mode={alertStyle}
                    onClose={props.onClose}
                    message={message}
                    tooltip={tooltip} />
    );
}
