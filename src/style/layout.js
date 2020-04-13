// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

export const FlexRow: StyledComponent<> = styled.div`
    display: flex;
    align-items: center;
`;

export const FlexColumn: StyledComponent<> = styled.div`
    display: flex;
    flex-direction: column;
`;

export const CardWrapper: StyledComponent<{ grow?: bool }> = styled(FlexColumn)`
    border: 1px solid rgba(0, 0, 0, 0.2);
    margin-bottom: 0.5em;
    ${props => props?.grow ? 'height: 100%;' : ''}
`;

const CardBody: StyledComponent<{ grow?: bool }> = styled.div`
    padding: 5px;
    border-top: 1px solid rgba(0, 0, 0, 0.2);
    ${props => props?.grow ? 'height: 100%;' : ''}
`;

type CardTitleProps = { +color: string };
const CardTitle: StyledComponent<CardTitleProps> = styled(FlexRow)`
    background-color: ${props => props.color};
    color: white;
    padding: 5px;
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
            <CardBody grow={grow}>
                {children.slice(1)}
            </CardBody>
        </CardWrapper>
    );
}
