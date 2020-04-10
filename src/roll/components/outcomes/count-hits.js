// @flow

import './roll-record.css';

import React from 'react';

import RollRecord from './roll-record';
import RollingDice from '../dice-list';

import CountHitsResult from 'roll/result/count-hits';
import { pluralize } from 'srutil';

type CountHitsRecordProps = {
    recordKey: number;
    outcome: CountHitsResult;
    onClose: (number) => void;
}

export default function CountHitsRecord(props: CountHitsRecordProps) {
    const outcome = props.outcome;
    const result = outcome.result;

    let message = "";
    if (result.isCrit()) {
        message = (
            <div className="badge badge-error">
                <b>Critical Glitch!</b>
            </div>
        );
    }
    else if (result.isGlitched()) {
        message = (
            <div className="badge badge-warning">
                <b>Glitch!</b>
            </div>
        );
    }
    else {
        message = (
            <span>
                <b>{result.hits}</b> {pluralize(result.hits, " hit")}
            </span>
        );
    }

    // Deep copy of result's rolls
    const rolls: number[] = [];
    rolls.push(...result.dice);

    return (
        <RollRecord label={`Count hits (${outcome.result.dice.length})`}
                    onClose={props.onClose}
                    message={message}>
            <RollingDice dice={result.dice} />
            {message}
        </RollRecord>
    );
}
