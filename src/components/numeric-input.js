// @flow

import './numeric-input.css';

import * as React from 'react';

import {
    FormGroup, InputGroup,
    FormControl, Button, Glyphicon
} from 'react-bootstrap';

import { Parser, evaluate } from '../math';

type Props = {
    controlId: string;
    onSelect: (?number) => void;
};

type RoundingMode = "up" | "down";

type State = {
    isExpression: boolean;
    errorPos: ?number;
    text: string;
    value: ?number;
    roundingMode: RoundingMode;
}

const CALCULATOR = "🖩";

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
        console.log("Input event: ", event.target);
        // Evaluate the text.
        if (event.target.value == null) {
            console.log("It's null???");
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
        console.log("Parsed expression: ", expr);
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
            console.log("Eval'd expression:", value);
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
                    const rounded = this.state.roroundingMode === 'up' ?
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
        this.setState({
            roundingMode: this.state.roundingMode === 'up' ?
                "down" : "up"
        });
    }

    render() {
        console.log("Rendering text ", this.state.text);
        console.log("Rendering value ", this.state.value);
        const value = this.state.value;

        // If we have a typo'd expression.
        const invalid = this.state.isExpression && value == null;

        let validationState: ?string = null;
        let suffix: React.Node = "";
        let extra: React.Node = "";

        if (invalid) {
            validationState = "error";
            suffix = (
                <InputGroup.Addon className="numeric-input-suffix">
                    --
                </InputGroup.Addon>
            );
            extra = (
                <InputGroup.Addon>
                    <abbr title="Typo location">
                        @{this.state.errorPos || "?"}
                    </abbr>
                </InputGroup.Addon>
            );
        }
        else if (value != null && this.state.isExpression) {
            suffix = (
                <InputGroup.Addon className="numeric-input-suffix">
                    {value}
                </InputGroup.Addon>
            );
            if (!Number.isInteger(value)) {
                const icon = this.state.roundmroundingMode === "up" ?
                    "arrow-up" : "arrow-down";
                const rounded = this.state.roundingMode === 'up' ?
                    Math.ceil(value) : Math.floor(value);
                suffix = (
                    <InputGroup.Addon className="numeric-input-suffix">
                        {rounded}
                    </InputGroup.Addon>
                );
                extra = (
                    <InputGroup.Button>
                        <Button onClick={this.handleRoundModeChange}>
                            <Glyphicon icon={icon} />
                        </Button>
                    </InputGroup.Button>
                )
            }
        }

        return (
            <FormGroup controlId={this.props.controlId}
                       validationState={validationState}
                       className="numeric-input-form-group">
                <InputGroup className="numeric-input-group">
                    <InputGroup.Addon className="numeric-input-caluclator">
                        {CALCULATOR}
                    </InputGroup.Addon>
                    <FormControl className="numeric-input"
                                 type="text"
                                 inputMode="numeric"
                                 value={this.state.text}
                                 onChange={this.handleInputEvent} />
                    {suffix}
                    {extra}
                </InputGroup>
            </FormGroup>
        );
    }
}

/** Number-oriented input. */
export function NsumericInput(props: Props) {
    function handleInputEvent(event: SyntheticInputEvent<HTMLInputElement>) {
        const value: number = parseInt(event.target.value, 10);
        if (isNaN(value)) {
            props.onSelect(null);
        }
        else {
            props.onSelect(value);
        }
    }

    let value = "";
    if (props.value != null) {
        value = props.value;
    }

    return (
        <InputGroup className="numeric-input-group">
            <InputGroup.Addon className="numeric-input-calculator">
                {CALCULATOR}
            </InputGroup.Addon>
            <FormControl className="numeric-input"
                         type="number"
                         value={value}
                         onChange={handleInputEvent} />
            {""}
        </InputGroup>
    );
}
