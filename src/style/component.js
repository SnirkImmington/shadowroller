// @flow

import * as React from 'react';
import styled, { keyframes } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import { color } from 'styled-system';
import theme from './theme';

import * as srutil from 'srutil';

type InputProps = { monospace? : bool };
export const Input: StyledComponent<InputProps> = styled.input.attrs(props => ({
    type: "text",
}))`
    ${color}
    font-family: ${props => props.monospace ? '"source-code-pro", monospace' : "inherit"};
    max-width: ${(props) => props.size ? '100%' : '12em'};

    margin: 0px 0.25em;
    border: 2px solid darkslategray;
    padding: 6px;
    line-height: 1;

    &:focus {
        outline: 1px solid ${theme.colors.primary};
        border: 2px solid ${theme.colors.primary};
    }
`;

export const Button: StyledComponent<> = styled.button`
    font-size: 1em;
    font-weight: 500;
    padding: 0.2em 1em;
    border: 0;
    align-text: center;
    margin: 2px 0.25em;
    cursor: pointer;
    color: black;
    background-color: white;

    &:hover {
        text-decoration: underline;
    }

    &:active {
        background-color: #ddd;
    }

    &[disabled] {
        pointer-events: none;
        cursor: not-allowed;
        color: rgba(0, 0, 0, 0.69);
        background-color: #ccc;
    }
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
    color: #333;
`;

export const HashColored: StyledComponent<{ id: string }> = styled.b`
    color: ${props => srutil.hashedColor(props.id)}
`;

type NameProps = { +id: string, +name: string };
export function PlayerName({ id, name }: NameProps) {
    return (
        <HashColored id={id}>{name}</HashColored>
    );
}
