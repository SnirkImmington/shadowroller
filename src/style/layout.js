// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import flexbox from '@styled-system/flexbox';

export const FlexRow: StyledComponent<> = styled.div`
    display: flex;
    align-items: center;
`;

export const FlexColumn: StyledComponent<> = styled.div`
    display: flex;
    flex-direction: column;
`;

export const Flex: StyledComponent<> = styled.div(
    {
        display: "flex",
    },
    flexbox
)

export const Menu: StyledComponent<> = styled.div`
    background-color: rgba(22, 22, 22, 0.2);
    padding: 0.5em;
`;

export const ColumnToRow: StyledComponent<> = styled(FlexColumn)`
    @media all and (min-width: 768px) {
        flex-direction: row;
    }
`;

export const CardWrapper: StyledComponent<{ grow?: bool }> = styled(FlexColumn)`
    margin-bottom: 0.5em;
    ${props => props?.grow ? 'height: 100%;' : ''}
`;

const CardBody: StyledComponent<{ grow?: bool, +color: string }> = styled.div`
    padding-top: 5px;
    ${props => props?.grow ? 'height: 100%;' : ''}
`;

export const CardTitleText: StyledComponent<{ +color: string }> = styled.b`
    font-family: monospace;
    color: ${props => props.color};
    font-size: 1.1rem;

    &::before {
        content: '> ';
    }
`;

type CardTitleProps = { +color: string };
const CardTitle: StyledComponent<CardTitleProps> = styled(FlexRow)`
    border-bottom: 2px solid ${props => props.color};
    padding: .5rem 1rem;
    width: 100%;

`;

type CardProps = {
    grow?: bool,
    color: string,
    +children: React.Node[]
};
export function Card({ color, children, grow }: CardProps) {
    return (
        <CardWrapper grow={grow}>
            <CardTitle color={color}>{ children[0] }</CardTitle>
            <CardBody color={color} grow={grow}>
                {children.slice(1)}
            </CardBody>
        </CardWrapper>
    );
}
