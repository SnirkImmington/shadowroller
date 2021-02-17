import styled, { StyledComponent, keyframes } from 'styled-components/macro';

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
    color: #666;

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
export const Flavor: StyledComponent<"i", any, FlavorProps> = styled.i`
    color: ${props => props.warn ? props.theme.colors.warning : props.light ? "#fffd" : "#333"};
`;

export const PlayerColored: StyledComponent<"b", any, { color: string, light?: boolean }> = styled.b`
    white-space: nowrap;
    color: ${props => props.color};
    ${props => props.light ? "padding: 1px; background: white;" : ""}
`;
