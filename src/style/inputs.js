// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import { color, layout } from 'styled-system';
import typeof Theme from './theme';

type InputProps = { monospace? : bool };
export const Input: StyledComponent<InputProps, Theme> = styled.input.attrs(props => ({
    type: props.type ?? "text",
}))`
    ${color}
    ${layout}
    font-family: ${props => props.monospace ? '"Source Code Pro", monospace' : "inherit"};
    max-width: ${(props) => props.expand ? '100%' : '14em'};
    height: calc(1em + 10px);

    margin: 0px 0.5em;
    border: 1px solid lightslategray;
    padding: 5px;
    line-height: 1;
    font-size: 1em;

    &:focus {
        outline: 1px solid ${props => props.theme.colors.secondary};
        border: 1px solid ${props => props.theme.colors.secondary};
    }
`;

export const LinkButton: StyledComponent<{}, Theme> = styled.button`
    display: inline;
    font-weight: bold;
    font-size: 1em;
    line-height: 1;
    user-select: none;
    cursor: pointer;
    ${({ minor }) => !minor && 'text-decoration: underline;'}

    color: ${({light, minor, theme}) =>
        minor ? theme.colors.primaryDesaturated3 :
        (light ? theme.colors.secondary : theme.colors.primaryLight)
    };
    background-color: transparent;
    border: 0;
    outline: 0;
    padding: 2px;
    white-space: pre;

    &[disabled] {
        cursor: not-allowed !important;
        text-decoration: none;
        color: ${({theme}) => theme.colors.dieNone};
    }

    &:hover &[disabled=""] {
        filter: brightness(125%);
    }

    &:active {
        filter: brightness(85%);
    }

    &:focus {
        filter: brightness(85%);
    }
`;

export const Button: StyledComponent<{}, Theme> = styled.button`
    font-size: 1.05em;
    line-height: 1;
    font-weight: bold;
    padding: 0.1em 0;
    text-align: center;
    border: 0px;
    margin: 0;
    cursor: pointer;
    color: ${props => props.theme.colors.secondary};
    background-color: transparent;
    white-space: pre;

    &:before {
        content: "[";
        margin: 0 0.01em 0 0.1em;
        font-family: "Source Code Pro", monospace;
    }
    &:after {
        content: "]";
        margin: 0 0.1em 0 0.01em;
        font-family: "Source Code Pro", monospace;
    }

    &:hover {
        &:before {
            content: "[";
        }

        &:after {
            content: "]";
        }
    }
    &:focus {
        &:before { content: "["; }
        &:after { content: "]"; }
    }

    &:active {
        color: ${props => props.theme.colors.secondaryPressed};
        &:before { content: "[" }
        &:after { content: "]" }
    }

    &[disabled] {
        pointer-events: none;
        cursor: not-allowed;
        color: ${props=>props.theme.colors.secondaryDesaturated2};
    }
    ${color}
`;
const HiddenInput = styled.input.attrs(props => ({
    checked: props.checked, name: props.name, id: props.id, value: props.value,
}))`
    position: absolute;
    opacity: 0;
    height: 0;
    width: 0;
`;

const RadioSelector = styled.span`
    line-height: 1.5;
    font-family: ${({theme}) => theme.fonts.monospace};
    font-weight: bold;
    color: ${({light, theme}) =>
        light ? theme.colors.secondaryDark : theme.colors.primaryDesaturated
    };
    textAlign: center;
`;

const RadioLabel: StyledComponent<> = styled.label`
    display: inline-flex;
    line-height: 1.5;
    font-size: 1em;
    cursor: pointer !important;
    user-select: none;
    white-space: pre;
    font-family: ${({theme}) => theme.fonts.monospace};

    &:hover {
        filter: brightness(180%);
    }

    & *:checked {
        filter: brightness(50%);
        text-decoration: underline;
    }

`;

type RadioLinkProps = {
    id: string,
    name?: string,
    edgy?: bool,
    light?: bool,
    type: "checkbox" | "radio",
    checked: bool,
    disabled?: bool,
    onChange: (SyntheticInputEvent<HTMLInputElement>) => void,
    children?: React.Node,
};
export const RadioLink = React.memo<RadioLinkProps>(function RadioLink(props) {
    return (
        <RadioLabel htmlFor={props.id} checked={props.checked} edgy={props.edgy} light={props.light}>
            <HiddenInput id={props.id} type={props.type}
                         value={props.id} disabled={props.disabled}
                         checked={props.checked} name={props.name}
                         onChange={props.onChange} />

            <RadioSelector light={!props.light}>
                {props.checked? '[X]' : '[ ]'}
            </RadioSelector>
            <span style={{ width: '.2em'}} />
            {props.children}
        </RadioLabel>
    )
});
