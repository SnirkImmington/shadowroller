// @flow

import React, { Component } from 'react';
import { Panel } from 'react-bootstrap';
import { connect } from 'react-redux';

import CountHitsRecord from '../components/outcomes/count-hits';
import RollAgainstRecord from '../components/outcomes/roll-against';
import TestForRecord from '../components/outcomes/test-for';

// These imports are used in Flow asserts.
import RollResult from '../result/roll-result'; //eslint-disable-line no-unused-vars
import CountHitsResult from '../result/count-hits'; //eslint-disable-line no-unused-vars
import TestForResult from '../result/test-for'; //eslint-disable-line no-unused-vars
import RollAgainstResult from '../result/roll-against'; //eslint-disable-line no-unused-vars
import typeof RollOutcome from '../result';

import { DEFAULT_ROLL_STATE } from '../../state';
import type { AppState, DispatchFn } from '../../state';
import * as rollActions from '../actions';

type Props = {
    dispatch: DispatchFn,
    outcomes: Array<RollOutcome>;
};
type State = {
    hidden: boolean
};

/** Displays the given rolls. */
class RollHistoryPanel extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            hidden: false
        };
    }

    handleHide = () => {
        this.setState({ hidden: true });
    }
    handleShow = () => {
        this.setState({ hidden: false });
    }

    onRecordClosed = (index: number) => {
        this.props.dispatch(rollActions.deleteOutcome(index));
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
                    <a href="#chummer" onClick={this.handleShow}>show</a>
                    :
                    <a href="#chummer-chum-chum" onClick={this.handleHide}>hide</a>
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

            if (entry[1].mode === 'count-hits') {
                const outcome: any = entry[1];
                result.push(
                    <CountHitsRecord key={index}
                                     recordKey={index}
                                     onClose={this.onRecordClosed}
                                     outcome={outcome} />
                );
            }
            else if (entry[1].mode === 'roll-against') {
                const outcome: any = entry[1];
                result.push(
                    <RollAgainstRecord key={index}
                                       recordKey={index}
                                       onClose={this.onRecordClosed}
                                       outcome={outcome} />
                );
            }
            else if (entry[1].mode === 'test-for') {
                const outcome: any = entry[1];
                result.push(
                    <TestForRecord key={index}
                                   recordKey={index}
                                   onClose={this.onRecordClosed}
                                   outcome={outcome} />
                );
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

function mapStateToProps(state: AppState) {
    return {
        outcomes: state.roll.outcomes || DEFAULT_ROLL_STATE.outcomes
    };
}

export default connect(mapStateToProps)(RollHistoryPanel);
