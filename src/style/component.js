// @flow

import * as React from 'react';
import styled, { keyframes } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

import * as srutil from 'srutil';

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

export const HashColored: StyledComponent<{ id?: string, color?: string, light?: bool }> = styled.b`
    white-space: nowrap;
    color: ${props => props.color || srutil.hashedColor(props.id)};
    ${props => props.light ? "padding: 1px; background: white;" : ""}
`;

type NameProps = { +id: string, +name: string, color?: string, light?: bool };
export function PlayerName({ id, name, light }: NameProps) {
    return (
        <HashColored light={light} id={id}>{name}</HashColored>
    );
}
