// @flow

import React, { Component } from 'react';

import RollRecord from './roll-record';
import SortedDiceList from './sorted-dice-list'

import '../roll-menu.css';

import TestForResult from '../result/test-for';
import pluralize from '../../util/pluralize'

type TestForRecordProps = {
    recordKey: any,
    outcome: TestForResult,
    onClose: (number) => void;
};

export default function TestForRecord(props: TestForRecordProps) {
    const outcome = props.outcome;
    const result = outcome.result;
    const hitDiff = result.hits - outcome.threshold;
    const status = (result.status === 'Hit' ? "Success" : result.status);

    let alertStyle = "success";
    if (result.isGlitched()) {
            alertStyle = (result.isCrit() ? "danger" : "warning");
    }
    else if (hitDiff < 0) {
        alertStyle = "danger";
    }

    const hits = (hitDiff === 1 ? "hit" : "hits");
    let message;
    if (hitDiff >= 0) {
        message = (
            <span className="roll-record-message">
                <b>{status + "! "}</b>
                <b>{hitDiff}</b>{" net" + pluralize(hitDiff, " hit") + "."}
            </span>
        );
    }
    else {
        message = (
            <span className="roll-record-message">
                <b>{"Failure! "}</b>
                <b>{-hitDiff}</b>{pluralize(-hitDiff, " hit")+" below."}
            </span>
        );
    }

    const rolls = [];
    rolls.push(...result.dice);

    const tooltip = (
        <span>
            <p>Rolling{" " + result.dice.length+" "}dice
            threshold{" " + outcome.threshold + ": "}</p>
            <SortedDiceList rolls={rolls} />
        </span>
    );

    return (
        <RollRecord className="try-for-record"
                    label="Threshold"
                    recordKey={props.recordKey}
                    mode={alertStyle}
                    onClose={props.onClose}
                    message={message}
                    tooltip={tooltip} />
    )
}
