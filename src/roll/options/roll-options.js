// @flow

import React, { Component } from 'react';
import {
    Form, FormGroup,
    FormControl, ControlLabel,
    DropdownButton, MenuItem,
    Glyphicon,
} from 'react-bootstrap';

import TestForRollOptions from './test-for';
import RollAgainstRollOptions from './roll-against';

// Roll input to allow the user select and perform roll actions.
//
// Features:
// - Number input: number of dice to roll [per round]
// - Mode: roll <input> dice counting hits, roll <input> dice against <input2>
//
// * The user can press the `Roll` button to request the roll be shown. The
// button is grayed out while random rolls are being requested. Once the buffer
// is filled, the `Roll` button becomes clickable.
//
// * The user inputs a number and selects a mode from the input. The mode maRollMenuy
// give additional parameters fo

type RollMode = "count-hits" | "test-for" | "roll-against";
type CountHitsParams = {|
    mode: "count-hits", dice: number
|};
type TestForParams = {|
    mode: "test-for", dice: number,
    testFor: number
|}
type RollAgainstParams = {|
    mode: "roll-against", dice: number,
    rollAgainst: number
|}
export type RollParams =
| CountHitsParams
| TestForParams
| RollAgainstParams;

type RollOptionsProps = {
    // How to handle the `submit` button.
    onParamsSelected: (?RollParams) => void;
};

// We keep track of all possible inputs so we can reset the UI when mode
// changes.
type RollOptionsState = {
    dice: ?number;
    mode: RollMode;
    testFor: ?number;
    rollAgainst: ?number;
    minTime: ?number;
    maxTime: ?number;
};

const rollInfo = {
    "count-hits": { title: "counting hits", disabled: false },
    "test-for": { title: "testing for", disabled: false },
    "roll-against": { title: "against", disabled: false },
    "extended": { title: "extended", disabled: true }
}

const rollSelections = Object.keys(rollInfo).map(option =>
    <MenuItem key={option}
              eventKey={option}
              disabled={rollInfo[option].disabled}
              className="roll-input-mode-item">
        {rollInfo[option].title}
    </MenuItem>
);

export default class RollOptions extends Component<RollOptionsProps, RollOptionsState> {
    handleRollModeChange: Function;
    handleDiceChange: Function;
    handleTestForChange: Function;
    handleRollAgainstChange: Function;
    paramsValid: Function;
    constructor(props: RollOptionsProps) {
        super(props);
        this.state = {
            dice: null,
            mode: "count-hits",
            testFor: null,
            rollAgainst: null,
            minTime: null,
            maxTime: null,
        };
        this.handleRollModeChange = this.handleRollModeChange.bind(this);
        this.handleDiceChange = this.handleDiceChange.bind(this);
        this.handleTestForChange = this.handleTestForChange.bind(this);
        this.handleRollAgainstChange = this.handleRollAgainstChange.bind(this);
        this.paramsValid = this.paramsValid.bind(this);
    }

    paramsValid(): boolean {
        if (this.state.dice == null) {
            return false;
        }
        else if (this.state.mode === 'test-for') {
            return this.state.testFor != null;
        }
        else if (this.state.mode === 'roll-against') {
            return this.state.rollAgainst != null;
        }
        else {
            return false;
        }
    }

    handleRollModeChange(mode: RollMode, event: SyntheticInputEvent<DropdownButton>) {
        this.setState({
            mode: mode
        });
        if (this.state.dice == null) {
            this.props.onParamsSelected(null);
        }
        else if (mode === 'count-hits') {
            this.props.onParamsSelected({
                mode: 'count-hits',
                dice: this.state.dice
            });
        }
        else if (mode === 'roll-against'
                 && this.state.rollAgainst != null) {
            this.props.onParamsSelected({
                mode: 'roll-against',
                dice: this.state.dice,
                rollAgainst: this.state.rollAgainst
            });
        }
        else if (mode === 'test-for'
                 && this.state.testFor != null) {
            this.props.onParamsSelected({
                mode: 'test-for',
                dice: this.state.dice,
                testFor: this.state.testFor
            });
        }
        else {
            this.props.onParamsSelected(null);
        }
    }

    handleDiceChange(args: SyntheticInputEvent<HTMLInputElement>) {
        let dice: ?number = null;
        if (!isNaN(parseInt(args.target.value, 10))) {
            dice = parseInt(args.target.value, 10);
            if (dice < 0) { dice = null; }
        }
        this.setState({
            dice: dice
        });
        if (this.state.mode === "count-hits") {
            if (dice != null) {
                this.props.onParamsSelected({
                    mode: "count-hits",
                    dice: dice
                });
            }
            else {
                this.props.onParamsSelected(null);
            }
        }
    }

    handleTestForChange(testFor: ?number) {
        console.log("Test for change");
        this.setState({ testFor: testFor });
        if (this.state.mode === "test-for"
            && this.state.dice != null
            && testFor != null) {
            this.props.onParamsSelected({
                mode: "test-for",
                dice: this.state.dice,
                testFor: testFor
            });
        }
        else {
            this.props.onParamsSelected(null);
        }
    }

    handleRollAgainstChange(rollAgainst: ?number) {
        this.setState({ rollAgainst: rollAgainst });
        if (this.state.mode === "roll-against"
            && this.state.dice != null
            && rollAgainst != null) {
            this.props.onParamsSelected({
                mode: 'roll-against',
                dice: this.state.dice,
                rollAgainst: rollAgainst
            });
        }
        else {
            this.props.onParamsSelected(null);
        }
    }

    render() {
        const dropdownTitle = (
            <span id="roll-mode-input-title">
                {rollInfo[this.state.mode].title}
                <Glyphicon className="roll-mode-input-glyph"
                           glyph="menu-down" />
            </span>
        )
        let extraOptions;
        if (this.state.mode === 'count-hits') {
            extraOptions = "";
        }
        else if (this.state.mode === 'test-for') {
            extraOptions = (
                <TestForRollOptions value={this.state.testFor}
                                    onChange={this.handleTestForChange} />
            );
        }
        else if (this.state.mode === 'roll-against') {
            extraOptions = (
                <RollAgainstRollOptions value={this.state.rollAgainst}
                                        onChange={this.handleRollAgainstChange} />
            );
        }
        return (
            <span id="roll-options">
                <FormGroup controlId="roll-input-dice">
                    <ControlLabel className="roll-menu-label">
                        Roll
                    </ControlLabel>
                    <FormControl className="numeric-input"
                                 type="input"
                                 bsSize="large"
                                 onChange={this.handleDiceChange} />
                    <ControlLabel className="roll-menu-label">
                        dice
                    </ControlLabel>
                </FormGroup>
                <FormGroup controlId="roll-input-mode">
                    <DropdownButton bsSize="large"
                                    id="roll-input-mode"
                                    noCaret
                                    title={dropdownTitle}
                                    onSelect={this.handleRollModeChange}>
                        {rollSelections}
                    </DropdownButton>
                </FormGroup>
                {extraOptions}
            </span>
        );
    }
}
