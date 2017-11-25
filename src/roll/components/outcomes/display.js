// @flow

import './roll-record.css';

import * as React from 'react';

import RollRecord from './roll-record';
import SortedDiceList from './sorted-dice-list';

import DisplayResult from '../../result/display';

type Props = {
    recordKey: number,
    outcome: DisplayResult,
    onClose: (number) => void,
};

export default function HighlightRecord(props: Props) {
    const outcome = props.outcome;
    const mode = props.outcome.displayMode;

    let alertStyle: string, modeDisplay: string;

    if (mode === 'max') {
        switch (outcome.highlighted) {
            case 6: case 5:
                alertStyle = 'success';
                break;
            case 4: case 3:
                alertStyle = 'warning';
                break;
            default:
                alertStyle = "danger";
        }
        modeDisplay = "Maximum"
    }
    else if (mode === 'min') {
        switch (outcome.highlighted) {
            case 1: case 2:
                alertStyle = "success";
                break;
            case 3: case 4:
                alertStyle = 'warning';
                break;
            default:
                alertStyle = 'danger';
        }
        modeDisplay = "Minimum"
    }
    else {
        modeDisplay = "All";
        alertStyle = 'success';
    }

    let message: React.Node;

    if (mode === 'all') {
        message = (
            <span className="roll-record-message">
                <b>All:</b>
                <span className='sorted-dice-list'>
                    {" " + outcome.dice.join(", ")}
                </span>
            </span>
        );
    }
    else {
        message = (
            <span className="roll-record-message">
                <b>{modeDisplay}:</b>
                {" " + outcome.highlighted}
            </span>
        );
    }
    const tooltip = (
        <span>
            <p>Rolling{" " + outcome.dice.length+" "}dice:</p>
            <SortedDiceList rolls={outcome.dice} />
        </span>
    );
    return (
        <RollRecord className="highlight-record"
                    label="Display"
                    recordKey={props.recordKey}
                    mode={alertStyle}
                    onClose={props.onClose}
                    message={message}
                    tooltip={tooltip} />
    );
}
