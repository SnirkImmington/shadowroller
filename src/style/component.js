// @flow

import * as React from 'react';
import styled, { keyframes } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as srutil from 'srutil';

type InputProps = { monospace? : bool };
export const Input: StyledComponent<InputProps> = styled.input.attrs(props => ({
    type: "text",
}))`
    font-family: ${props => props.monospace ? "monospace" : "inherit"};
    max-width: 10em;
    margin: 0px 0.25em;
`;

export const Button: StyledComponent<> = styled.button`
    font-size: 1em;
    padding: 0.1em 1em;
    border-radius: 0px;
    align-text: center;
    margin: 0px 0.25em;
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

export const HashColored: StyledComponent<{ id: string }> = styled.b`
    color: ${props => srutil.hashedColor(props.id)}
`;

type NameProps = { +id: string, +name: string };
export function PlayerName({ id, name }: NameProps) {
    return (
        <HashColored id={id}>{name}</HashColored>
    );
}
