import styled, { keyframes } from 'styled-components/macro';

import * as colorUtil from 'colorUtil';

const diceFrames = keyframes`
    0%   { content: '\\2680'; }
    25%  { content: '\\2681'; }
    40%  { content: '\\2682'; }
    60%  { content: '\\2683'; }
    75%  { content: '\\2684'; }
    100% { content: '\\2685'; }
`;

export const DiceSpinner = styled.span`
    font-size: 1.5em;
    font-weight: 800;
    padding: 0.25em;
    color: ${({theme}) => theme.colors.dieNeutral};

    &::after {
        content: '';
        animation: ${diceFrames} 2s linear infinite;
    }
`;

export const DieIcon = styled.span`
    color: lightslategray;
    font-weight: 900;
    font-size: 2em;
    padding: 0.2em;

    &::after {
        content: '\\2680';
    }
`;

export type FlavorProps = {
    warn?: boolean,
    light?: boolean,
}
export const Flavor = styled.i<FlavorProps>`
    color: ${props => props.warn ? props.theme.colors.highlight : props.theme.colors.textSecondary};
`;

export const PlayerColored = styled.b<{ hue: number|null|undefined }>`
    white-space: nowrap;
    color: ${({theme, hue}) => colorUtil.playerColor(hue, theme)};
`;
