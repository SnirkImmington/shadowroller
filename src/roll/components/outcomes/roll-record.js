// @flow

import './roll-record.css';

import * as React from 'react';
import RollingDice from '../dice-list';

type Props = {
    outcome: RollRecord;
    index: number;
    showNumbers: bool;
    onClose: (index: number) => void;
};

export default function RollRecord(props: Props) {
    const { outcome, index, showNumbers, onClose } = props;

    let title: React.Node, body: React.Node;

    if (outcome.mode === "count-hits") {
        const { result } = outcome;
        title = `Rolled ${result.dice.length} dice`;
        body = <RollingDice dice={result.dice} showNumbers={showNumbers} />;
    }
    else if (outcome.mode === "test-for") {
        const { result } = outcome;
        title = `Rolled ${result.dice.length} dice, testing for ${outcome.threshold} hits`;
        body = <RollingDice dice={result.dice} showNumbers={showNumbers} />;
    }
    else if (outcome.mode === "roll-against") {
        const { userRoll, foeRoll } = outcome;
        title = `Rolled ${userRoll.dice.length} dice vs. ${foeRoll.dice.length} dice`;
        body = (
            <div class="row">
                <span class="col">
                <RollingDice dice={userRoll.dice} showNumbers={showNumbers} />
                </span>v.s.<span class="col">
                <RollingDice dice={foeRoll.dice} showNumbers={showNumbers} />
                </span>
            </div>
        );
    }

    return (
        <div className="card mb-3 border-0 roll-record-entry">
            <div className="card-header text-left roll-record-header">
                <div className="row justify-content-center align-content-center">
                    <div className="col-auto mr-auto my-auto">
                        {title}
                    </div>
                    <div className="col-auto roll-record-buttons">
                        <button className="btn btn-sm close"
                                onClick={() => onClose(index)}>
                            &times;
                        </button>
                    </div>
                </div>
            </div>
            <div className="card-body conatainer">
                <div className="row no-gutters">
                    {body}
                </div>
            </div>
        </div>
    );
}
