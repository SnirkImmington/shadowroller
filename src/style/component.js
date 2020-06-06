// @flow

import * as React from 'react';
import styled, { keyframes } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import { color } from 'styled-system';
import typeof Theme from './theme';

import * as srutil from 'srutil';

type InputProps = { monospace? : bool };
export const Input: StyledComponent<InputProps, Theme> = styled.input.attrs(props => ({
    type: props.type ?? "text",
}))`
    ${color}
    font-family: ${props => props.monospace ? '"source-code-pro", monospace' : "inherit"};
    max-width: ${(props) => props.size ? '100%' : '12em'};
    max-height: calc(1em + 12px);

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

export const Button: StyledComponent<{}, Theme> = styled.button`
    font-size: 1.05em;
    line-height: 1;
    font-weight: bold;
    padding: 0.2em .5em;
    align-text: center;
    border: 0px;
    margin: 0;
    cursor: pointer;
    color: ${props => props.theme.colors.secondary};
    background-color: transparent;
    white-space: pre;

    &:before {
        content: " ";
        margin-right: .25em;
        font-family: "source-code-pro", monospace;
    }
    &:after {
        content: " ";
        margin-left: .25em;
        font-family: "source-code-pro", monospace;
    }

    &:hover {
        &:before {
            content: ">";
        }

        &:after {
            content: "<";
        }
    }
    &:focus {
        &:before { content: ">"; }
        &:after { content: "<"; }
    }

    &:active {
        color: ${props => props.theme.colors.secondaryPressed};
        &:before { content: ">" }
        &:after { content: "<" }
    }

    &[disabled] {
        pointer-events: none;
        cursor: not-allowed;
        color: ${props=>props.theme.colors.secondaryDesaturated2};
    }
    ${color}
`;

export const BaseButton: StyledComponent<> = styled.button`
`;

const diceFrames = keyframes`
    0%   { content: '\\2680'; }
    25%  { content: '\\2681'; }
    40%  { content: '\\2682'; }
    60%  { content: '\\2683'; }
    75%  { content: '\\2684'; }
    100% { content: '\\2685'; }
`;

export const DiceSpinner: StyledComponent<> = styled.span`
    font-size: 1.5em;
    font-weight: 800;
    padding: 0.25em;
    color: #666;

    &::after {
        content: '';
        animation: ${diceFrames} 2s linear infinite;
    }
`;

export const DieIcon: StyledComponent<> = styled.span`
    color: lightslategray;
    font-weight: 900;
    font-size: 2em;
    padding: 0.2em;

    &::after {
        content: '\\2680';
    }
`;

export const Flavor: StyledComponent<> = styled.i`
    color: ${props => props.warn ? props.theme.colors.warning : props.light ? "#fffd" : "#333"};
`;

export const HashColored: StyledComponent<{ id: string, light?: bool }> = styled.b`
    color: ${props => srutil.hashedColor(props.id)};
    ${props => props.light ? "padding: 1px; background: white;" : ""}
`;

type NameProps = { +id: string, +name: string, light?: bool };
export function PlayerName({ id, name, light }: NameProps) {
    return (
        <HashColored light={light} id={id}>{name}</HashColored>
    );
}
