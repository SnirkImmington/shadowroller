import * as React from 'react';
import styled from 'styled-components/macro';

export const NoWrap = styled.span`
    white-space: nowrap;
    flex-grow: 1;
`;

export type FlexRowProps = {
    alignItems?: "flex-start"|"flex-end"|"center"|"stretch"|"baseline",
    maxWidth?: boolean,
    flexWrap?: boolean,
    formRow?: boolean,
    inputRow?: boolean,
    flexGrow?: boolean,
    justifyContent?: "flex-start"|"flex-end"|"center"|"space-between"|"space-around"|"space-evenly",
    floatRight?: boolean,
    spaced?: boolean,
    formSpaced?: boolean,
}
export const FlexRow = styled.div<FlexRowProps>`
    display: flex;
    align-items: ${({alignItems}) => alignItems ?? 'center'};
    ${({maxWidth}) => maxWidth && 'width: 100%;'}
    ${({flexWrap}) => flexWrap && 'flex-wrap: wrap;'}
    ${({formRow}) => formRow && 'margin-bottom: .5rem;'}
    ${({flexGrow}) => flexGrow && 'flex-grow: 1;'}
    justify-content: ${({justifyContent}) => justifyContent ?? 'inherit'};

    ${({floatRight}) => floatRight &&
        '& > *:last-child { margin-left: auto; }'
    }

    ${({ spaced }) => spaced &&
        '& > * { margin-right: .5rem; } & > *:last-child { margin-right: inherit; }'
    }

    ${({formSpaced}) => formSpaced &&
        '& > * { margin-right: 1.25rem; } & > *:last-child { margin-right: inherit; }'
    }

    ${({ inputRow }) => inputRow &&
        'min-height: calc(1rem + 16px); align-items: center;'
    }
`;

export type FlexColumnProps = {
    grow?: boolean,
    alignItems?: "flex-start"|"flex-end"|"center"|"stretch"|"baseline",
    maxWidth?: boolean,
    flexWrap?: boolean,
    bottomGap?: boolean,
    spaced?: boolean,
}
export const FlexColumn = styled.div<FlexColumnProps>`
    display: flex;
    flex-direction: column;
    ${({grow}) => grow && 'flex-grow: 1;'}
    align-items: ${({alignItems}) => alignItems ?? 'inherit'};
    ${({maxWidth}) => maxWidth && 'width: 100%;'}
    ${({flexWrap}) => flexWrap && 'flex-wrap: wrap;'}
    ${({bottomGap}) => bottomGap && 'margin-bottom: 1.5rem;'}

    ${({spaced}) => spaced &&
        '& > * { margin-bottom: .5rem; } & > *:last-child { margin-bottom: inherit; }'
    }
`;

export const TextWithIcon = styled.div<{ color?: string }>`
    & > svg:first-child {
        color: ${({color, theme}) => color || theme.colors.dieOne};
        margin-right: 0.25em;
    }
`;

export const CardTitleText  = styled.b<{ color: string}>`
    font-family: "Source Code Pro", monospace;
    color: ${({theme}) => theme.colors.primary};
    font-size: 1.3rem;
    margin-left: 0.25em;
    line-height: 1.3em;
    white-space: pre;
    & > svg:first-child {
        margin-right: 0.4em;
    }
`;

type CardTitleProps = {
    color: string,
    padded?: boolean
};
const CardTitle = styled(FlexRow)<CardTitleProps>`
    flex-wrap: "wrap";
    margin-bottom: calc(.5rem + 2px);
    ${({ padded }) => padded && 'margin: 0 0.5rem 0 0.5rem;'}
    border-bottom: 2px solid ${({theme}) => theme.colors.primary};
`;

interface CardProps {
    grow?: boolean,
    padded?: boolean,
    bottomGap?: boolean,
    color: string,
    children: React.ReactNode[] // Card wants specific children shape
}
export function Card({ color, padded, bottomGap, children, grow }: CardProps) {
    return (
        <FlexColumn bottomGap={bottomGap} grow={grow}>
            <CardTitle padded={padded} color={color}>{ children[0] }</CardTitle>
            {children.slice(1)}
        </FlexColumn>
    );
}
