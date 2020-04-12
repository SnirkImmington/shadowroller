// @flow

import * as React from 'react';
import styled, { keyframes } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as srutil from 'srutil';

export const Button: StyledComponent<> = styled.button`
    font-size: 1em;
    padding: 0.2em 1em;
    border-radius: 0px;
    align-text: center;
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

export const HashColored: StyledComponent<{ id: string }> = styled.b`
    color: ${props => srutil.hashedColor(props.id)}
`;

type NameProps = { +id: string, +name: string };
export function PlayerName({ id, name }: NameProps) {
    return (
        <HashColored id={id}>{name}</HashColored>
    );
}
