// @flow

import React, { Component } from 'react';
import {Panel, Form, FormGroup } from 'react-bootstrap';

import RollButton from './roll-button';
import RandomLoadingLabel from './random-loading-label';
import RollHistoryPanel from './roll-history-panel';
import './roll-menu.css';

import RandomBuffer from '../util/random-buffer';

import RollResult from './result/roll-result';
import CountHitsResult from './result/count-hits';
import TestForResult from './result/test-for';
import RollAgainstResult from './result/roll-against';

import typeof RollOutcome from './result/roll-outcome';

import RollOptions from './options/roll-options';
import typeof CountHitsParams from './options/roll-options';
import typeof TestForParams from './options/roll-options';
import typeof RollAgainstParams from './options/roll-options';
import typeof RollParams from './options/roll-options';


// Roll menu for the user to perform roll actions. The RollMenu contains a
// `RollInput` and a collection of `RollResultViews`.
// Dice faces start at `U+2680`.

type RollMenuProps = {
    onRoll: (RollOutcome) => void
};

type RollMenuState = {
    buffer: RandomBuffer;
    isLoading: boolean;
    options: ?RollParams;
}
export default class RollInputPanel extends Component<RollMenuProps, RollMenuState> {
    handleBufferFill: Function;
    handleBufferRequest: Function;
    handleRollSubmit: Function;
    handleRollParamsSelected: Function;

    constructor(props: RollMenuProps) {
        super(props);

        this.handleBufferRequest = this.handleBufferRequest.bind(this);
        this.handleBufferFill = this.handleBufferFill.bind(this);

        const buffer = new RandomBuffer(this.handleBufferRequest, this.handleBufferFill);
        this.state = {
            buffer: buffer,
            isLoading: true,
            options: null,
        };
        // Fill buffer on page load.
        // Yeah, we should set up a DOM event or whatever, but at least it's
        // async and means the page will fix itself on reload.1
        buffer.fillBuffer();

        this.handleRollSubmit = this.handleRollSubmit.bind(this);
        this.handleRollParamsSelected = this.handleRollParamsSelected.bind(this);
    }

    handleBufferRequest() {
        this.setState({
            isLoading: true
        });
    }

    handleBufferFill() {
        this.setState({
            isLoading: false
        });
    }
    handleRollSubmit(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        if (this.state.options != null) {
            if (this.state.options.mode === "count-hits") {
                const params: CountHitsParams = this.state.options;
                const dice = this.state.buffer.requestRolls(params.dice);
                if (dice != null) {
                    const outcome: RollOutcome = new CountHitsResult(new RollResult(dice));
                    this.props.onRoll(outcome);
                }
            }
            else if (this.state.options.mode === 'test-for') {
                const params: TestForParams = this.state.options;
                const dice = this.state.buffer.requestRolls(params.dice);
                if (dice != null) {
                    const outcome: RollOutcome = new TestForResult(new RollResult(dice), params.testFor);
                    this.props.onRoll(outcome);
                }
            }
            else if (this.state.options.mode === 'roll-against') {
                const params: RollAgainstParams = this.state.options;
                const userDice = this.state.buffer.requestRolls(params.dice);
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
    }

    handleRollParamsSelected(options: ?RollParams) {
        this.setState({
            options: options
        });
        if (options != null) {
            let diceRequired: number = options.dice;
            if (options.mode === 'roll-against') {
                diceRequired += options.rollAgainst;
            }
            // else if extended
            this.setState(prevState => ({
                isLoading: prevState.buffer.checkForLimit(diceRequired)
            }));
        }
    }

    render() {
        const title = <span className='App-menu-panel-title'><b>Roll dice</b></span>;
        const isReady: bool = this.state.options != null && !this.state.isLoading;
        return (
            <Panel className="roll-input-panel" header={title} bsStyle="primary">
                <Form inline
                      className="roll-input-panel-form flex-split-container"
                      onSubmit={this.handleRollSubmit}>
                    <span className='roll-input-panel-left flex-split-left'>
                        <RollOptions
                            onParamsSelected={this.handleRollParamsSelected} />
                    </span>
                    <FormGroup controlId='roll-submit' className='flex-split-right'>
                        <RandomLoadingLabel
                                    isLoading={this.state.isLoading} />
                        <RollButton isLoading={!isReady}
                                    onClick={this.handleRollSubmit} />
                    </FormGroup>
                </Form>
            </Panel>
        );
    }
}
