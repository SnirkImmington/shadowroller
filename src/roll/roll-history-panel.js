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

type Props = {
    outcomes: Array<RollOutcome>;
    onRecordClosed: (number) => void;
}

type State = {
    hidden: boolean
}

export default class RollHistoryPanel extends Component<Props, State> {
    handleHide: Function;
    handleShow: Function;

    constructor(props: Props) {
        super(props);

        this.state = { hidden: false }

        this.handleHide = this.handleHide.bind(this);
        this.handleShow = this.handleShow.bind(this);
    }

    handleHide() {
        console.log("Handling hide");
        this.setState({ hidden: true });
    }
    handleShow() {
        console.log("Handling show");
        this.setState({ hidden: false });
    }

    render() {
        if (this.props.outcomes.length === 0) {
            return <span id='roll-history-panel' />
        }

        const entries = this.props.outcomes.entries();
        const header = (
            <span className="roll-history-panel-header">
                <b>Roll results</b> (
                {
                    this.state.hidden ?
                    <a href="#" onClick={this.handleShow}>show</a>
                    :
                    <a href="#" onClick={this.handleHide}>hide</a>
                })
            </span>
        );
        if (this.state.hidden) {
            return <Panel id="roll-history-panel"
                          header={header}
                          bsStyle="info" />
        }

        const result: Array<any> = [];
        for (const entry of entries) {
            const index: number = entry[0];
            const outcome: any = entry[1];

            if (outcome.mode === 'count-hits') {
                (outcome: CountHitsResult);
                result.push(
                    <CountHitsRecord key={index}
                                     recordKey={index}
                                     onClose={this.props.onRecordClosed}
                                     outcome={outcome} />
                );
            }
            else if (outcome.mode === 'roll-against') {
                (outcome: RollAgainstResult);
                result.push(
                    <RollAgainstRecord key={index}
                                       recordKey={index}
                                       onClose={this.props.onRecordClosed}
                                       outcome={outcome} />
                );
            }
            else if (outcome.mode === 'test-for') {
                (outcome: TestForResult);
                result.push(
                    <TestForRecord key={index}
                                   recordKey={index}
                                   onClose={this.props.onRecordClosed}
                                   outcome={outcome} />
                );
            }
            else if (outcome.mode === 'extended') {
            }
            else {
            }
        }

        return (
            <Panel id="roll-history-panel"
                   header={header}
                   bsStyle="info">
                {result}
            </Panel>
        )
    }
}
