// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import flexbox from '@styled-system/flexbox';

export const FlexRow: StyledComponent<> = styled.div`
    display: flex;
    align-items: center;
    ${props => props.maxWidth ? 'width: 100%;' : ''}
    ${props => props.flexWrap ? 'flex-wrap: wrap;' : ''}
`;

export const FlexColumn: StyledComponent<> = styled.div`
    display: flex;
    flex-direction: column;
    ${props => props.maxWidth ? 'width: 100%;' : ''}
    ${props => props.flexWrap ? 'flex-wrap: wrap;' : ''}
`;

export const Flex: StyledComponent<> = styled.div(
    {
        display: "flex",
    },
    flexbox
)

export const Menu: StyledComponent<> = styled.div`
    background-color: ${props=>props.theme.colors.gray2};
    color: white;
    padding: 0.5em;
`;

export const ColumnToRow: StyledComponent<{grow?: bool}> = styled(FlexColumn)`
    ${props => props?.grow ? 'height: 100%;' : ''}
    @media all and (min-width: 768px) {
        flex-direction: row;
    }
`;

export const CardWrapper: StyledComponent<{ grow?: bool, pad?: bool }> = styled(FlexColumn)`
    ${props => props?.pad ? 'padding-bottom: 10px;' : ''}
    ${props => props?.grow ? 'height: 100%;' : ''}
`;

const CardBody: StyledComponent<{ grow?: bool, +color: string }> = styled.div`
    ${props => props?.grow ? 'height: 100%;' : ''}
`;

export const CardTitleText: StyledComponent<{ +color: string }> = styled.b`
    font-family: "source-code-pro", monospace;
    color: ${props => props.color};
    font-size: 1.3rem;
    margin-left: 0.4em;
`;

type CardTitleProps = { +color: string };
const CardTitle: StyledComponent<CardTitleProps> = styled(FlexRow)`
    margin: 0.5rem;
    line-height: 1;
    padding-bottom: 0.25rem; /* Can't use line height because it pads the top too */
    border-bottom: 2px solid ${props => props.color};
    /*width: 50%*/;
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
