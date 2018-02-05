// @flow

import './numeric-input.css';

import * as React from 'react';

import {
    FormGroup, InputGroup,
    FormControl, Button
} from 'react-bootstrap';

import { Parser, evaluate } from '../math';

type Props = {
    controlId: string;
    onSelect: (?number) => void;
    min?: number;
    max?: number;
};

type RoundingMode = "up" | "down";

type State = {
    isExpression: boolean;
    errorPos: ?number;
    text: string;
    value: ?number;
    roundingMode: RoundingMode;
}

export default class NumericInput extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            isExpression: false,
            errorPos: null,
            text: "",
            value: null,
            roundingMode: "up",
        };
    }
    handleInputEvent = (event: SyntheticInputEvent<HTMLInputElement>) => {
        // Evaluate the text.
        if (event.target.value == null) {
            this.props.onSelect(null);
            this.setState({
                text: "",
                value: null,
                errorPos: null,
                isExpression: false
            });
        }
        const parser = new Parser(event.target.value);
        const expr = parser.expression();
        if (expr == null) {
            const errorPos = parser.position();
            this.props.onSelect(null);
            this.setState({
                text: event.target.value,
                value: null,
                errorPos,
                isExpression: true
            });
        }
        else {
            const value = evaluate(expr);
            if (isNaN(value)) {
                const errorPos = parser.position();
                this.props.onSelect(null);
                this.setState({
                    text: event.target.value,
                    errorPos,
                    value: null,
                    isExpression: true
                });
            }
            else {
                // If it's not exact, dispatch the rounded.
                if (!Number.isInteger(value)) {
                    const rounded = this.state.roundingMode === 'up' ?
                        Math.ceil(value) : Math.floor(value);
                    this.props.onSelect(rounded);
                }
                else {
                    this.props.onSelect(value);
                }
                this.setState({
                    text: event.target.value,
                    value,
                    errorPos: null,
                    isExpression: expr.type !== 'number'
                });

            }
        }
    }

    handleRoundModeChange = (event: SyntheticInputEvent<HTMLButtonElement>) => {
        const newMode = this.state.roundingMode === 'up' ? "down" : "up";
        if (this.state.value != null) {
            const selectedValue = newMode === 'up' ?
            Math.ceil(this.state.value) : Math.floor(this.state.value);
            this.props.onSelect(selectedValue);
        }
        this.setState({
            roundingMode: newMode
        });
    }

    render() {
        const value = this.state.value;
        let rounded = value;
        if (value != null && !Number.isInteger(value)) {
            rounded = this.state.roundingMode === "up" ?
                Math.ceil(value) : Math.floor(value);
        }

        // If we have a typo'd expression.
        const invalid = this.state.isExpression && value == null;

        let validationState: ?string = null;
        let result: React.Node = "";
        let error: React.Node = "";
        let warning: React.Node = "";

        if (invalid && this.state.text !== "") {
            validationState = "error";
        }
        else if (value != null && this.state.isExpression) {
            result = (
                <InputGroup.Addon className="numeric-input-suffix">
                    {value}
                </InputGroup.Addon>
            );
        }
        if (rounded !== value) {
            const icon = this.state.roundingMode === "up" ?
                "fa fa-arrow-up" : "fa fa-arrow-down";
            result = (
                <InputGroup.Addon className="numeric-input-suffix">
                    {rounded}
                </InputGroup.Addon>
            );
            error = (
                <InputGroup.Button>
                    <Button onClick={this.handleRoundModeChange}>
                        <i className={icon}></i>
                    </Button>
                </InputGroup.Button>
            );
        }
        if (rounded != null) {
            if (this.props.min != null && rounded < this.props.min) {
                validationState = "warning";
                warning = (
                    <InputGroup.Addon className="numeric-input-suffix">
                        {`< ${this.props.min}`}
                    </InputGroup.Addon>
                );
            }
            if (this.props.max != null && rounded > this.props.max) {
                validationState = "warning";
                warning = (
                    <InputGroup.Addon className="numeric-input-suffix">
                        {`> ${this.props.max}`}
                    </InputGroup.Addon>
                );
            }
        }

        return (
            <FormGroup controlId={this.props.controlId}
                       validationState={validationState}
                       className="numeric-input-form-group">
                <InputGroup className="numeric-input-group">
                    <InputGroup.Addon>
                        <i className="fa fa-calculator" aria-hidden="true"></i>
                    </InputGroup.Addon>
                    <FormControl className="numeric-input"
                                 type="tel"
                                 inputMode="numeric"
                                 value={this.state.text}
                                 onChange={this.handleInputEvent} />
                    {result}
                    {error}
                    {warning}
                </InputGroup>
            </FormGroup>
        );
    }
}
