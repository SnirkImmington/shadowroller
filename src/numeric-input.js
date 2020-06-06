// @flow

import * as React from 'react';
import { Parser, evaluate } from 'math';

import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

import * as UI from 'style';
import * as icons from 'style/icon';

type RoundingMode = "up" | "down";
type Props = {
    id: string,
    onSelect: (?number) => void,
    min?: number,
    max?: number,
    value?: number,
    round?: RoundingMode,
};

type ValueState =
| "empty"
| "tooSmall"
| "tooBig"
| ["error", number]
// value, is rounded
| ["literal", number, bool]
| ["expr", number, bool]
;

const StyledInput = styled(UI.Input)`
    margin-left: 0;
    margin-right: 0;
    border-left: none;

    &:focus {
        border-left: none;
    }
`;

// Component covers making sure each part matches the height and border style.
const Component = styled.div`
    padding: 5px;
    border: 1px solid lightslategray;
    background: #eee;
    margin: 0;

    /* There's no "previous sibling" selector, so it's all following. */
    ${StyledInput}:focus ~ & {
        border: 1px solid ${props => props.theme.colors.secondary};
        outline: 1px solid ${props => props.theme.colors.secondary};
    }
`;

const Parent: StyledComponent<> = styled(UI.FlexRow)`
    font-family: "source-code-pro", monospace;
    margin-right: 0.5em;
    height: calc(1rem + 10px);

    & > * {
        height: calc(1rem + 10px);
    }
`;

const CalcBox = styled(Component)`
    background: ${props => props.color ?? props.theme.colors.primary};
    color: white;
    width: calc(1.8em);
    margin-left: 0.5em;
    padding: 0px;
    order: -1;

    &:focus {
        border-right: none;
        outline-right: none;
    }
`;
const ErrorBox = styled(Component)`
    background: ${props => props.theme.colors.warning};
`;
const RoundingBox = styled(Component)`
    color: white; /* ?? */
    background: ${props => props.theme.colors.secondary};
`;


export default function NumericInput(props: Props) {
    const [text, setText] = React.useState<string>("");
    const [state, setState] = React.useState<ValueState>("empty");
    const [round, setRound] = React.useState<RoundingMode>(props.round ?? "up");
    const [showInfo, setInfoShown] = React.useState<bool>(false);

    let computed: number = 0;
    if (props.value != null) {
        computed = props.value;
    }
    if (typeof state !== "string" && state[0] !== "error") {
        computed = state[1];
    }

    console.log("NunericInput:", { text, state, round, computed });

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
        let rounded = false;
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
            rounded = true;
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
            setState(["literal", value, rounded]);
        }
        else {
            setState(["expr", value, rounded]);
        }
        props.onSelect(value);
    }

    function roundingModeToggle(event: SyntheticInputEvent<HTMLButtonElement>) {
        setRound(round => round === 'up' ? 'down' : 'up');
    }

    let components: React.Node[] = [
        <StyledInput type="tel" aria-label="Calculator" inputMode="numeric"
               value={text} onChange={onTextInput} key="input" />,
        <CalcBox key="calc">
            <span className="fa-layers">
                <UI.FAIcon icon={icons.faPlus}   transform="shrink-4 up-2 left-2" />
                <UI.FAIcon icon={icons.faMinus}  transform="shrink-4 up-2 right-11" />
                <UI.FAIcon icon={icons.faTimes}  transform="shrink-4 down-9 left-2" />
                <UI.FAIcon icon={icons.faDivide} transform="shrink-4 down-9 right-11" />
            </span>
        </CalcBox>
    ];

    if (state === "tooSmall") {
        components.push(
            <ErrorBox key="small">
                2smol
            </ErrorBox>
        );
    }
    else if (state === "tooBig") {
        components.push(
            <ErrorBox key="big">
                2big
            </ErrorBox>
        );
    }
    else if (state === "empty" || state[0] === "literal") { }
    else if (state[0] === "expr") {
        components.push(
            <Component key="value">
                {state[1]}
            </Component>
        );
    }
    else if (state[0] === "error") {
    }

    return (
        <Parent>
            {components}
        </Parent>
    );
}