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

export type ColumnToRowProps = {
    grow?: boolean,
    formRow?: boolean,
    rowCenter?: boolean,
    maxWidth?: boolean,
    floatRight?: boolean,
    justifyContentRow?: "flex-start"|"flex-end"|"center"|"space-between"|"space-around"|"space-evenly",
    rowSpaced?: boolean,
}
export const ColumnToRow = styled(FlexColumn)<ColumnToRowProps>`
    ${({grow}) => grow && 'height: 100%;'}
    ${props => props.formRow && 'margin-bottom: .5rem;'}
    ${({theme}) => theme.queries.leftWide} {
        flex-direction: row;
        ${({ maxWidth }) => maxWidth && 'width: 100%;'}
        ${props => props.rowCenter && 'align-items: center;'}
        ${({ floatRight }) => floatRight &&
            '& > *:last-child { margin-left: auto; }'
        }
        ${props => props.justifyContentRow && `justify-content: ${props.justifyContentRow};`}
        ${({ rowSpaced }) => rowSpaced &&
            '& > * { margin-right: .5rem; } & > *:last-child { margin-right: inherit; }'
        }
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
    white-space: nowrap;
    color: ${({theme}) => theme.colors.primary};
    font-size: 1.3rem;
    margin-left: 0.4em;
    line-height: 1.3em;
    & > svg:first-child {
        margin-right: 0.4em;
    }
`;

type CardTitleProps = {
    color: string,
    padRight?: boolean
};
const CardTitle = styled(FlexRow)<CardTitleProps>`
    margin: 0 0 .75rem 0;
    ${({ padRight }) => padRight && 'margin-right: 0.5rem;'}
    border-bottom: 2px solid ${({theme}) => theme.colors.primary};
`;

const CardBodyPadding = styled(FlexColumn)`
    padding: 0 .5rem;
    width: 100%;
`;

interface CardProps {
    grow?: boolean,
    padRight?: boolean,
    bottomGap?: boolean,
    unpadded?: boolean,
    color: string,
    children: React.ReactNode[] // Card wants specific children shape
}
export function Card({ color, unpadded, padRight, bottomGap, children, grow }: CardProps) {
    const inner = unpadded ?
        children.slice(1) :
        (<CardBodyPadding>{children.slice(1)}</CardBodyPadding>);
    return (
        <FlexColumn bottomGap={bottomGap} grow={grow}>
            <CardTitle padRight={padRight} color={color}>{ children[0] }</CardTitle>
            {inner}
        </FlexColumn>
    );
}
