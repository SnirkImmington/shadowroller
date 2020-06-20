// @flow

import * as React from 'react';
import styled, { keyframes } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import { color } from 'styled-system';
import typeof Theme from './theme';

import { FlexRow } from './layout';
import * as srutil from 'srutil';

const HiddenInput = styled.input`
    position: absolute;
    opacity: 0;
    height: 0;
    width: 0;
`;

const RadioSelector = styled.span`
    font-family: ${({theme}) => theme.fonts.monospace};
    &:before {
        content: '[';
        color: black;
        font-weight: 400;
    }
    &:after {
        content: ']';
        color: black;
        font-weight: 400;
    }
    font-weight: bold;
    margin-left: 0.5em;
    margin-right: 0.25em;
    color: ${({light, theme}) =>
        light ? theme.colors.secondary : theme.colors.primaryDesaturated
    };
    white-space: pre;
`;

const RadioLabel: StyledComponent<> = styled.label`
    display: flex;
    margin: 0.5em;
    line-height: 1.5;
    font-size: 1em;
    cursor: pointer !important;
    user-select: none;

    color: ${({light, theme}) =>
        light ? theme.colors.secondary : theme.colors.primaryDesaturated
    };

    &:hover {
        filter: brightness(120%);
    }

    & input:checked {
        filter: brightness(50%);
    }

`;

type RadioLinkProps = {
    id: string,
    edgy?: bool,
    light?: bool,
    type: "checkbox" | "radiobox",
    checked: bool,
    onChange: (SyntheticInputEvent<HTMLInputElement>) => void,
    children?: React.Node,
};
export function RadioLink({ id, light, edgy, type, checked, onChange, children }: RadioLinkProps) {
    return (
        <RadioLabel htmlFor={id} edgy={edgy} light={light}>
            <HiddenInput id={id} type={type}
                         checked={checked}
                         onChange={onChange} />
            <RadioSelector light={!light}>
                {checked? 'X' : ' '}
            </RadioSelector>
            {children}
        </RadioLabel>
    )
}
