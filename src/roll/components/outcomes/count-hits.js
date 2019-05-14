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

    let message = "";
    if (result.isCrit()) {
        message = (
            <div className="badge badge-error">
                <b>Critical glitch!</b>
            </div>
        );
    }
    else if (result.isGlitched()) {
        message = (
            <React.Fragment>
                <div className="badge badge-warning roll-record-label">
                    Glitch
                </div>
                <b>{result.hits}</b>
                {pluralize(result.hits, " hit")}
            </React.Fragment>
        );
    }
    else if (result.hits > 0) {
        message = (
            <span>
                <b>{result.status + "! "}</b>
                <b>{result.hits}</b>{pluralize(result.hits, " hit")}.
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

    return (
        <RollRecord label={`Count hits (${outcome.result.dice.length})`}
                    recordKey={props.recordKey}
                    onClose={props.onClose}
                    message={message}>
            <SortedDiceList rolls={[...result.dice]} />
        </RollRecord>
    );
}
