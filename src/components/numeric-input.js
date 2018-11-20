// @flow

import './numeric-input.css';

import * as React from 'react';

import { Parser, evaluate } from '../math';

type Props = {
    controlId: string;
    onSelect: (?number) => void;
    value?: ?number;
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
            text: props.value ? props.value.toString() : "",
            value: props.value,
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
                <span className="input-group-text numeric-input-suffix">
                    {value}
                </span>
            );
        }
        if (rounded !== value) {
            const icon = this.state.roundingMode === "up" ?
                "fa fa-arrow-up" : "fa fa-arrow-down";
            result = (
                <span className="input-group-text numeric-input-suffix">
                    {rounded}
                </span>
            );
            error = (
                <button className="btn btn-outline-secondary"
                        type="button"
                        aria-label={"Currently rounding " + this.state.roundingMode}
                        onClick={this.handleRoundModeChange}>
                    <i className={icon}></i>
                </button>
            );
        }
        if (rounded != null) {
            if (this.props.min != null && rounded < this.props.min) {
                validationState = "warning";
                warning = (
                    <span className="input-group-text bg-warning numeric-input-suffix">
                        {`< ${this.props.min}`}
                    </span>
                );
            }
            if (this.props.max != null && rounded > this.props.max) {
                validationState = "warning";
                warning = (
                    <span className="input-group-text bg-warning numeric-input-suffix">
                        {`> ${this.props.max}`}
                    </span>
                );
            }
        }

        const post: React.Node = result || error || warning ? (
            <div className="input-group-append">
                {result}
                {error}
                {warning}
            </div>
        ) : "";

        return (
            <div className="input-group mx-2 mx-lg-0">
                <div className="input-group-prepend">
                    <span className="input-group-text">
                        <i className="fa fa-calculator"
                           aria-hidden="true"></i>
                    </span>
                </div>
                <input className="numeric-input form-control pr-0"
                       type="tel"
                       aria-label="Calculator"
                       inputMode="numeric"
                       value={this.state.text}
                       onChange={this.handleInputEvent} />
                {post}
            </div>
        );
    }
}
