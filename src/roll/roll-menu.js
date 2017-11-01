// @flow

import React, { Component } from 'react';

import RollInputPanel from './roll-input-panel';
import RollHistoryPanel from './roll-history-panel';
import './roll-menu.css';
import '../App.css';

import typeof RollOutcome from './result/roll-outcome';

type RollMenuState = {
    outcomes: Array<RollOutcome>
};

export default class RollMenu extends Component<{}, RollMenuState> {
    handleRoll: Function;
    handleRecordClose: Function;

    constructor(props: {}) {
        super(props);
        this.state = {
            outcomes: []
        };
        this.handleRoll = this.handleRoll.bind(this);
        this.handleRecordClose = this.handleRecordClose.bind(this);
    }

    handleRoll(outcome: RollOutcome) {
        this.setState(prevState => ({
            outcomes: [outcome, ...prevState.outcomes]
        }));
    }

    handleRecordClose(index: number) {
        console.log("Hanlding record close: ", index);
        const outcomes = this.state.outcomes;
        console.log("Outcomes: ", outcomes)
        const firstPart = outcomes.slice(0, index);
        console.log("First: ", firstPart);
        const secondPart = outcomes.slice(index + 1);
        console.log("Second: ", secondPart);
        console.log("Concatted: ", [...firstPart, ...secondPart]);
        this.setState({
            outcomes: [...firstPart, ...secondPart]
        });
    }

    render() {
        return (
            <div className="roll-menu App-wide-container">
                <RollInputPanel onRoll={this.handleRoll} />
                <RollHistoryPanel outcomes={this.state.outcomes}
                                  onRecordClosed={this.handleRecordClose} />
            </div>
        )
    }
}
