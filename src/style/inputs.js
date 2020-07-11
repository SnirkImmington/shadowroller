// @flow

import * as React from 'react';
import styled, { keyframes } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import { color } from 'styled-system';
import typeof Theme from './theme';

import { FlexRow } from './layout';
import * as srutil from 'srutil';

type InputProps = { monospace? : bool };
export const Input: StyledComponent<InputProps, Theme> = styled.input.attrs(props => ({
    type: props.type ?? "text",
}))`
    ${color}
    font-family: ${props => props.monospace ? '"source-code-pro", monospace' : "inherit"};
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
    font-family: "source-code-pro", monospace;
    font-weight: bold;
    font-size: 1em;
    user-select: none;
    cursor: pointer;
    text-decoration: underline;

    color: ${({light, theme}) =>
        light ? theme.colors.secondary : theme.colors.primaryLight
    };
    background-color: transparent;
    border: 0;
    outline: 0;
    padding: 2px;
    white-space: pre;

    &[disabled] {
        pointer-events: none;
        cursor: not-allowed !important;
        text-decoration: none;
        filter: grayscale(80%);
    }

    &:hover {
        filter: brightness(115%);
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
        font-family: "source-code-pro", monospace;
    }
    &:after {
        content: "]";
        margin: 0 0.1em 0 0.01em;
        font-family: "source-code-pro", monospace;
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
    font-family: ${({theme}) => theme.fonts.monospace};
    &:before {
        content: '[';
        color: black;
        font-weight: 400;
    }
    &:after {
        content: ']';
        color: black;
        font-weight: 400;
    }
    font-weight: bold;
    margin-left: 0.5em;
    margin-right: 0.25em;
    color: ${({light, theme}) =>
        light ? theme.colors.secondaryDark : theme.colors.primaryDesaturated
    };
    white-space: pre;
`;

const RadioLabel: StyledComponent<> = styled.label`
    display: flex;
    margin-right: 0.5em;
    line-height: 1.5;
    font-size: 1em;
    cursor: pointer !important;
    user-select: none;

    color: #222;

    &:hover {
        filter: brightness(180%);
    }

    & > *:checked {
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
    onChange: (SyntheticInputEvent<HTMLInputElement>) => void,
    children?: React.Node,
};
export const RadioLink = React.memo<RadioLinkProps>(function RadioLink(props) {
    return (
        <RadioLabel htmlFor={props.id} checked={props.checked} edgy={props.edgy} light={props.light}>
            <HiddenInput id={props.id} type={props.type}
                         value={props.id}
                         checked={props.checked} name={props.name}
                         onChange={props.onChange} />
            <RadioSelector light={!props.light}>
                {props.checked? 'X' : ' '}
            </RadioSelector>
            {props.children}
        </RadioLabel>
    )
});
