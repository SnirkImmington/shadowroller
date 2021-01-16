// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

export const NoWrap: StyledComponent<> = styled.span`
    white-space: nowrap;
    flex-grow: 1;
`;

export const FlexRow: StyledComponent<> = styled.div`
    display: flex;
    align-items: ${props => props.alignItems ? props.alignItems : "center"};
    ${props => props.maxWidth && 'width: 100%;'}
    ${props => props.flexWrap && 'flex-wrap: wrap;'}
    ${props => props.formRow && 'margin-bottom: .5rem;'}
    ${props => props.flexGrow && `flex-grow: 1;`}
    ${props => props.justifyContent && `justify-content: ${props.justifyContent};`}

    ${({ floatRight }) => floatRight &&
        '& > *:last-child { margin-left: auto; }'
    }

    ${({ spaced }) => spaced &&
        '& > * { margin-right: .5rem; } & > *:last-child { margin-right: inherit; }'
    }
`;

export const FlexColumn: StyledComponent<> = styled.div`
    display: flex;
    flex-direction: column;
    ${({ grow }) => grow && 'flex-grow: 1;'}
    ${props => props.alignItems ? `align-items: ${props.alignItems};` : ''}
    ${props => props.maxWidth ? 'width: 100%;' : ''}
    ${props => props.flexWrap ? 'flex-wrap: wrap;' : ''}
    ${props => props.bottomGap && 'margin-bottom: 1.5rem;'}

    ${({ spaced }) => spaced &&
        '& > * { margin-bottom: .5rem; } & > *:last-child { margin-bottom: inherit; }'
    }
`;

export const ColumnToRow: StyledComponent<{grow?: bool}> = styled(FlexColumn)`
    ${props => props?.grow ? 'height: 100%;' : ''}
    ${props => props.formRow && 'margin-bottom: .5rem;'}
    @media all and (min-width: 768px) {
        flex-direction: row;
        ${({ maxWidth }) => maxWidth && 'width: 100%;'}
        ${props => props.rowCenter ? 'align-items: center;' : ''}
        ${({ floatRight }) => floatRight &&
            '& > *:last-child { margin-left: auto; }'
        }
        ${props => props.justifyContentRow && `justify-content: ${props.justifyContentRow};`}
        ${({ rowSpaced }) => rowSpaced &&
            '& > * { margin-right: .5rem; } & > *:last-child { margin-right: inherit; }'
        }
    }
`;

export const CardTitleText: StyledComponent<{ +color: string }> = styled.b`
    font-family: "Source Code Pro", monospace;
    white-space: nowrap;
    color: ${props => props.color};
    font-size: 1.3rem;
    margin-left: 0.4em;
    line-height: 1.3em;
`;

type CardTitleProps = { +color: string, +padRight?: bool };
const CardTitle: StyledComponent<CardTitleProps> = styled(FlexRow)`
    margin: 0 0 .75rem 0;
    ${({ padRight }) => padRight && 'margin-right: 0.5rem;'}
    border-bottom: 2px solid ${({ color }) => color};
`;

const CardBodyPadding: StyledComponent<> = styled(FlexColumn)`
    padding: 0 .5rem;
    width: 100%;
`;

type CardProps = {
    grow?: bool,
    padRight?: bool,
    bottomGap?: bool,
    unpadded?: bool,
    color: string,
    +children: React.Node[]
};
export function Card({ color, unpadded, padRight, bottomGap, children, grow }: CardProps) {
    const inner = unpadded ? children.slice(1) : <CardBodyPadding>{children.slice(1)}</CardBodyPadding>;
    return (
        <FlexColumn bottomGap={bottomGap} grow={grow}>
            <CardTitle padRight={padRight} color={color}>{ children[0] }</CardTitle>
            {inner}
        </FlexColumn>
    );
}
