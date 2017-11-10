// @flow

import React, { Component } from 'react';
import {
    Panel,
    Form, FormGroup,
    FormControl, ControlLabel
} from 'react-bootstrap';

import NumericInput from '../numeric-input';
import RollModeSelector from './options/roll-mode-selector';
import TestForOptions from './options/test-for';
import RollAgainstOptions from './options/roll-against';
import RandomLoadingLabel from './random-loading-label';
import RollButton from './roll-button';
import RollHistoryPanel from './roll-history-panel';
import './roll-menu.css';

import RandomBuffer from '../util/random-buffer';
import RollResult from './result/roll-result';
import CountHitsResult from './result/count-hits';
import TestForResult from './result/test-for';
import RollAgainstResult from './result/roll-against';

import typeof RollOutcome from './result/roll-outcome';

import type {
    RollMode,
    CountHitsParams,
    TestForParams,
    RollAgainstParams
} from './types';


// Roll menu for the user to perform roll actions. The RollMenu contains a
// `RollInput` and a collection of `RollResultViews`.
// Dice faces start at `U+2680`.

type Props = {
    onRoll: (RollOutcome) => void
};

type State = {
    buffer: RandomBuffer;
    isLoading: boolean;
    valid: boolean;
    dice: ?number;
    mode: RollMode;
    testFor: ?number;
    rollAgainst: ?number;
};

export default class RollInputPanel extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        const buffer = new RandomBuffer(this.handleBufferRequest,
                                        this.handleBufferFill);
        this.state = {
            buffer: buffer,
            isLoading: true,
            valid: false,
            dice: null,
            mode: "count-hits",
            testFor: null,
            rollAgainst: null,
        };
        // Fill buffer on page load.
        // Yeah, we should set up a DOM event or whatever, but at least it's
        // async and means the page will fix itself on reload.
        buffer.fillBuffer();
    }

    ready = (state: State): boolean => {
        if (state.isLoading) {
            return false;
        }
        if (state.dice === null) {
            return false;
        }
        if (state.mode === "count-hits") {
            return true;
        }
        else if (state.mode === "test-for") {
            return this.state.testFor != null;
        }
        else if (state.mode === "roll-against") {
            return this.state.rollAgainst != null;
        }
        else {
            return false;
        }
    }

    handleBufferRequest = () => {
        this.setState({
            isLoading: true
        });
    }

    handleBufferFill = () => {
        this.setState({
            isLoading: false
        });
    }

    prepareLoading = (givenState: State) => {
        let requiredDice: any = this.state.dice;

        if (this.state.mode === 'roll-against') {
            requiredDice += this.state.rollAgainst;
        }

        this.setState({
            isLoading: this.state.buffer.ensureLimit(requiredDice)
        });
    }

    handleRollSubmit = (event: SyntheticInputEvent<HTMLButtonElement>) => {
        event.preventDefault();
        if (!this.ready(this.state) || this.state.dice == null) {
            console.log("Not ready!");
            return;
        }

        if (this.state.mode === "count-hits") {
            const params: CountHitsParams = {
                mode: 'count-hits',
            };
            const dice = this.state.buffer.requestRolls(this.state.dice);
            if (dice != null) {
                const outcome: RollOutcome = new CountHitsResult(new RollResult(dice));
                this.props.onRoll(outcome);
            }
        }
        else if (this.state.mode === 'test-for') {
            const params: TestForParams = {
                mode: 'test-for',
                testFor: this.state.testFor || 0 // should always be a number.
            };
            const dice = this.state.buffer.requestRolls(this.state.dice);
            if (dice != null) {
                const outcome: RollOutcome = new TestForResult(new RollResult(dice), params.testFor);
                this.props.onRoll(outcome);
            }
        }
        else if (this.state.mode === 'roll-against') {
            const params: RollAgainstParams = {
                mode: 'roll-against',
                rollAgainst: this.state.rollAgainst || 0
            };
            const userDice = this.state.buffer.requestRolls(this.state.dice);
            const foeDice = this.state.buffer.requestRolls(params.rollAgainst);
            if (userDice != null && foeDice != null) {
                const outcome: RollOutcome = new RollAgainstResult(
                    new RollResult(userDice), new RollResult(foeDice)
                );
                this.props.onRoll(outcome);
            }
        }
        else {
            // Should not happen
            console.log("Invalid roll options selected:", this.state);
        }
    }

    handleDiceChange = (dice: ?number) => {
        console.log("Dice change ", dice);
        this.prepareLoading(Object.assign({}, this.state, { dice: dice }));
        this.setState({
            dice: dice
        });
    }

    handleRollModeSelect = (mode: RollMode) => {
        this.prepareLoading(Object.assign({}, this.state, { mode: mode }));
        this.setState({
            mode: mode
        });
    }

    handleTestForSelect = (testFor: ?number) => {
        this.prepareLoading(Object.assign({}, this.state, { testFor: testFor }));
        this.setState({
            testFor: testFor
        });
    }

    handleRollAgainstSelect = (rollAgainst: ?number) => {
        this.prepareLoading(Object.assign({}, this.state, { rollAgainst: rollAgainst }));
        this.setState({
            rollAgainst: rollAgainst
        });
    }

    getRollOptions = (mode: RollMode) => {
        if (mode === 'count-hits') {
            return <div />;
        }
        else if (mode === "test-for") {
            return <TestForOptions value={this.state.testFor}
                                   onChange={this.handleTestForSelect} />;
        }
        else if (mode === "roll-against") {
            return <RollAgainstOptions value={this.state.rollAgainst}
                                       onChange={this.handleRollAgainstSelect} />;
        }
        else {
            return <div />;
        }
    }

    render = () => {
        const title = <span className='App-menu-panel-title'>
            <b>Roll dice</b>
        </span>;
        const isReady = this.ready(this.state);
        const options = this.getRollOptions(this.state.mode);
        console.log("Rendering with", this.state);
        return (
            <Panel id="roll-input-panel" header={title} bsStyle="primary">
                <form id="roll-input-panel-form"
                      onSubmit={this.handleRollSubmit}>
                    <FormGroup id='roll-input-dice-group'
                               controlId="roll-input-dice">
                        <ControlLabel className="roll-menu-label">
                            Roll
                        </ControlLabel>
                        <NumericInput min={0} value={this.state.dice || ''}
                                      onSelect={this.handleDiceChange} />
                        <ControlLabel className="roll-menu-label">
                            dice
                        </ControlLabel>
                    </FormGroup>
                    <RollModeSelector selected={this.state.mode}
                                      onSelect={this.handleRollModeSelect} />
                    {options}
                    <FormGroup id='roll-input-submit-group'
                               controlId='roll-submit'>
                        <RandomLoadingLabel
                                    isLoading={this.state.isLoading} />
                        <RollButton isLoading={!isReady}
                                    onClick={this.handleRollSubmit} />
                    </FormGroup>
                </form>
            </Panel>
        );
    }
}
