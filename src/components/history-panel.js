// @flow

import React, { Component } from 'react';
import {
    Panel, FormGroup, ControlLabel, FormControl
} from 'react-bootstrap';

import '../App.css';
import './history-panel.css';

import CountHitsRecord from '../roll/components/outcomes/count-hits';
import RollAgainstRecord from '../roll/components/outcomes/roll-against';
import TestForRecord from '../roll/components/outcomes/test-for';
import DisplayRecord from '../roll/components/outcomes/display';

// These imports are used in Flow asserts.
import RollResult from '../roll/result/roll-result'; //eslint-disable-line no-unused-vars
import CountHitsResult from '../roll/result/count-hits'; //eslint-disable-line no-unused-vars
import TestForResult from '../roll/result/test-for'; //eslint-disable-line no-unused-vars
import RollAgainstResult from '../roll/result/roll-against'; //eslint-disable-line no-unused-vars
import typeof RollOutcome from '../roll/result';

type Props = {

};

type State = {

};

function onRecordClosed(ix: number) { }

function record(ix: number, hits: number, glitch: boolean = false) {
    let numbers = [];
    for (let i = 0; i < hits; i++) {
        numbers.push(6);
        if (glitch) {
            numbers.push(1);
        }
    }
    return (
        <CountHitsRecord key={ix} recordKey={ix}
                         onClose={onRecordClosed}
                         outcome={new CountHitsResult(new RollResult(numbers))} />
    );
}

export default function HistoryPanel(props: Props) {
    const header = (
        "History"
    );
    return (
        <Panel header={header} id="history-panel" bsStyle="info">
            <div id="history-panel-scroll">
                {record(0, 4)}
                {record(1, 6)}
                {record(5, 4)}
                {record(2, 3, true)}
                {record(3, 2)}
                {record(4, 0, true)}
                {record(6, 2, true)}
                {record(7, 5)}
                {record(8, 2)}
                {record(9, 1)}
            </div>
        </Panel>
    )
}
