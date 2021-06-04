import * as React from 'react';
import { Parser, evaluate } from 'math';
import type { Setter } from 'srutil';

import styled from 'styled-components/macro';

import * as UI from 'style';
import * as icons from 'style/icon';

type RoundingMode = "up" | "down";
type Props = {
    id: string,
    onSelect: (value: number | null) => void,
    min?: number,
    max?: number,
    small?: boolean,
    value?: number | null,
    text?: string,
    setText?: Setter<string>,
    placeholder?: string,
    round?: RoundingMode,
    disabled?: boolean,
};

type ValueState =
| "empty"
| "tooSmall"
| "tooBig"
| ["error", number]
// value, is rounded
| ["literal", number, boolean]
| ["expr", number, boolean]
;

type InputProps = { small?: boolean, disabled?: boolean, id: string };

const StyledInput = styled(UI.Input).attrs<InputProps>(
    (props) => ({ "type": "tel", disabled: props.disabled, id: props.id })
)<InputProps>`
    margin-left: 0;
    margin-right: 0;

    border: 0;
    outline: 0;

    width: ${props => props.small ? '2.5em' : '4em'};

    &:focus {
        border: 0;
        outline: 0;
    }
`;

// Component covers making sure each part matches the height and border style.
const Component = styled.div`
    padding: 5px;
    background: ${({theme}) => theme.colors.background};
    margin: 0;

    border: 0;
    outline: 0;
`;

const Parent = styled(UI.FlexRow)`
    font-family: "Source Code Pro", monospace;
    margin-right: 0.5em;
    margin-left: 0.5em;
    height: calc(1rem + 10px);

    outline: 1px solid slategray;

    & > * {
        height: calc(1rem + 10px);
    }

    &:focus-within {
        outline: 2px solid ${props => props.theme.colors.outline};
    }
`;

const CalcBox = styled(Component)`
    background: ${props => props.color ?? props.theme.colors.primary};
    color: ${({ theme }) => theme.light.background};
    width: calc(1.8em);
    padding: 0px;
    order: -1;
`;
const ErrorBox = styled(Component)(
    props => ({
        color: props.theme.colors.background,
        backgroundColor: props.theme.colors.highlight,
    })
);
/*
const RoundingBox = styled(Component)`
    color: white; / ?? /
    background: ${props => props.theme.colors.secondary};
`;
*/

export default function NumericInput(props: Props) {
    const [textHook, setTextHook] = React.useState<string>("");
    const [state, setState] = React.useState<ValueState>("empty");
    const [round] = React.useState<RoundingMode>(props.round ?? "up");
    //const [showInfo, setInfoShown] = React.useState<bool>(false);

    const text = props.text ?? textHook;
    const setText = props.setText ?? setTextHook;

    function onTextInput(event: React.ChangeEvent<HTMLInputElement>) {
        setText(event.target.value ?? "");
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

    /*function roundingModeToggle(event: React.TouchEvent<HTMLButtonElement>) {
        setRound(round => round === 'up' ? 'down' : 'up');
    }*/

    let components: React.ReactNode[] = [
        <StyledInput  inputMode="numeric"
                     value={text} onChange={onTextInput} key="input"
                     placeholder={props.placeholder} small={props.small}
                     disabled={props.disabled} id={props.id}
               />,
        <CalcBox key="calc">
            <span className="fa-layers">
                <UI.FAIcon icon={icons.faPlus}   transform="shrink-4" />
                <UI.FAIcon icon={icons.faMinus}  transform="shrink-4 right-12" />
                <UI.FAIcon icon={icons.faTimes}  transform="shrink-4 down-10" />
                <UI.FAIcon icon={icons.faDivide} transform="shrink-4 down-10 right-12" />
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
