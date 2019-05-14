// @flow

import './roll-record.css';

import * as React from 'react';
import typeof RollOutcome from '../../result';

type RollOutcomeData = {
    outcomes: Array<RollOutcome>;
    handleCloseButton: (index: number) => void;
}

type Props = {
    outcome: RollResult;
    index: number;
    onClose: (index: number) => void;
};

export default class RollRecord extends React.PureComponent<Props> {
    render() {
        console.log("Received props:", this.props);
        const { outcome, index, onClose } = this.props;

        return (
            <div className="card mb-3 border-0 roll-record-entry">
                <div className="card-header text-left roll-record-header">
                    <div className="row justify-content-center align-content-center">
                        <div className="col-auto mr-auto my-auto">
                            {` ${index}`}Rolled {" " + outcome.result.toString()}
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
                        oOoOo
                    </div>
                </div>
            </div>
        );
    }
}
