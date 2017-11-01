// @flow

import React, { Component } from 'react';
import { Panel } from 'react-bootstrap';

import RollRecord from './record/roll-record';
import CountHitsRecord from './record/count-hits';
import RollAgainstRecord from './record/roll-against';
import TestForRecord from './record/test-for';

import RollResult from './result/roll-result';
import CountHitsResult from './result/count-hits';
import TestForResult from './result/test-for';
import RollAgainstResult from './result/roll-against';

import typeof RollOutcome from './result/roll-outcome';

type RollHistoryProps = {
    outcomes: Array<RollOutcome>;
    onRecordClosed: (number) => void;
}

export default function RollHistoryPanel(props: RollHistoryProps) {
    const entries = props.outcomes.entries();
    const result: Array<any> = [];
    for (const entry of entries) {
        const index: number = entry[0];
        const outcome: any = entry[1];

        if (outcome.mode === 'count-hits') {
            (outcome: CountHitsResult);
            result.push(
                <CountHitsRecord key={index}
                                 recordKey={index}
                                 onClose={props.onRecordClosed}
                                 outcome={outcome} />
            );
        }
        else if (outcome.mode === 'roll-against') {
            (outcome: RollAgainstResult);
            result.push(
                <RollAgainstRecord key={index}
                                   recordKey={index}
                                   onClose={props.onRecordClosed}
                                   outcome={outcome} />
            );
        }
        else if (outcome.mode === 'test-for') {
            (outcome: TestForResult);
            result.push(
                <TestForRecord key={index}
                               recordKey={index}
                               onClose={props.onRecordClosed}
                               outcome={outcome} />
            );
        }
        else if (outcome.mode === 'extended') {
        }
        else {
        }
    }

    if (result.length === 0) {
        return <span id='roll-history-panel' />
    }

    const header = (
        <h1>Roll results</h1>
    );

    return (
        <Panel id="roll-history-panel"
               header={header}
               bsStyle="info">
            {result}
        </Panel>
    )
}
