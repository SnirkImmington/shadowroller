// @flow

import './roll-record.css';

import * as React from 'react';

type RollRecordProps = {
    recordKey: number;
    mode: string;
    label: string;
    onClose: (number) => void;
    message: React.Node;
    tooltip: React.Node;
}

function mutedOnClick(event: SyntheticInputEvent<HTMLButtonElement>) {
    event.preventDefault();
}

export default class RollRecord extends React.Component<RollRecordProps> {
    handleCloseButton = () => {
        this.props.onClose(this.props.recordKey);
    }

    render() {
        const alertClassName = "alert alert-" +
            this.props.mode + " roll-record-panel";

        return (
            <div className={alertClassName}>
                <div className="roll-record-info">
                    <div className="badge badge-secondary roll-record-label">
                        {this.props.label}
                    </div>
                    {this.props.message}
                </div>
                <div className='btn-group roll-record-buttons'>
                        <button className='btn roll-record-info'
                                onClick={mutedOnClick}
                                data-container="body"
                                data-toggle="tooltip"
                                data-placement="left"
                                data-html="true"
                                data-content={this.props.tooltip}>
                            <i className="fa fa-info-circle"></i>
                        </button>
                    <button className="btn roll-record-close"
                            onClick={this.handleCloseButton}>
                        <i className="fa fa-times"></i>
                    </button>
                </div>
            </div>
        );
    }
}
