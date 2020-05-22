// @flow

import * as React from 'react';
import { Parser, evaluate } from 'math';

import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

import * as UI from 'style';

type Props = {
    id: string,
    onSelect: (?number) => void,
    min?: number,
    max?: number,
    value?: number,
    round?: RoundingMode,
};

type RoundingMode = "up" | "down";
type ValueState =
| "empty"
| "tooSmall"
| "tooBig"
| ["error", number]
| ["literal", number]
| ["expr", number]
;

const Parent: StyledComponent<> = styled(UI.FlexRow)``;
const CalcBox = styled.div``;
const ErrorBox = styled.div``;
const RoundingBox = styled.div``;

const StyledInput = styled(UI.Input)`
    
`;

export default function NumericInput(props: Props) {
    const [text, setText] = React.useState<string>("");
    const [state, setState] = React.useState<ValueState>("empty");
    const [round, setRound] = React.useState<RoundingMode>(props.round ?? "up");
    const [isRounded, setIsRounded] = React.useState<bool>(false);

    let computed: number = 0;
    if (props.value != null) {
        computed = props.value;
    }
    if (typeof state !== "string" && state[0] !== "error") {
        computed = state[1];
    }

    console.log("NI2: ", { text, state, round, isRounded, computed });

    function onTextInput(event: SyntheticInputEvent<HTMLInputElement>) {
        setText(event.target.value);
        // Handle empty field - this is not an error condition
        if (!event.target.value) {
            setState("empty");
            props.onSelect(null);
            return;
        }
        // Parse an expression using the library
        const parser = new Parser(event.target.value);
        const expr = parser.expression();
        const pos = parser.position();
        console.log("Parsed:", parser.position(), parser, expr);
        // On parsing failure, set error
        if (!expr) {
            setState(["error", pos]);
            props.onSelect(null);
            return;
        }
        // If we didn't consume the whole string, there's garbage at the end
        if (pos !== event.target.value.length) {
            setState(["error", pos]);
            props.onSelect(null);
            return;
        }
        // Evaluate the expression
        let value = evaluate(expr);
        // On runtime error, set error
        if (isNaN(value)) {
            // We can't really give a good error position
            setState(["error", 1]);
            props.onSelect(null);
            return;
        }
        // Check if we have to round and set flag accordingly
        if (!Number.isInteger(value)) {
            value = round === 'up' ? Math.ceil(value) : Math.floor(value);
            setIsRounded(true);
        }
        else {
            setIsRounded(false);
        }
        // Check if we're in bounds
        if (props.min != null && value < props.min) {
            setState("tooSmall");
            props.onSelect(null);
            return;
        }
        if (props.max != null && value > props.max) {
            setState("tooBig");
            props.onSelect(null);
            return;
        }
        // Check if this is just a regular number
        if (expr.type === 'number') {
            setState(["literal", value]);
        }
        else {
            setState(["expr", value]);
        }
        props.onSelect(value);
    }

    function roundingModeToggle(event: SyntheticInputEvent<HTMLButtonElement>) {
        setRound(round => round === 'up' ? 'down' : 'up');
    }

    let components: React.Node[] = [
        <CalcBox key="calc">
            +-*/
        </CalcBox>,
        <input type="tel" aria-label="Calculator" inputMode="numeric"
               value={text} onChange={onTextInput} key="input" />
    ];

    if (state === "tooSmall") {
        components.push(
            <ErrorBox key="small">
                &lt;&nbsp;{props.min}
            </ErrorBox>
        );
    }
    else if (state === "tooBig") {
        components.push(
            <ErrorBox key="big">
                &gt;&nbsp;{props.max}
            </ErrorBox>
        );
    }

    return (
        <Parent>
            {components}
        </Parent>
    );
}
