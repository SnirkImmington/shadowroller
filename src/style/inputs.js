// @flow

import * as React from 'react';
import styled, { keyframes } from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import { color } from 'styled-system';
import typeof Theme from './theme';

import { FlexRow } from './layout';
import * as srutil from 'srutil';

const HiddenInput = styled.input.attrs(props => ({
    checked: props.checked, name: props.name, id: props.id, value: props.value,
}))`
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
        light ? theme.colors.secondaryDark : theme.colors.primaryDesaturated
    };
    white-space: pre;
`;

const RadioLabel: StyledComponent<> = styled.label`
    display: flex;
    margin-right: 0.5em;
    line-height: 1.5;
    font-size: 1em;
    cursor: pointer !important;
    user-select: none;

    color: #222;

    &:hover {
        filter: brightness(180%);
    }

    & > *:checked {
        filter: brightness(50%);
        text-decoration: underline;
    }

`;

type RadioLinkProps = {
    id: string,
    name?: string,
    edgy?: bool,
    light?: bool,
    type: "checkbox" | "radio",
    checked: bool,
    onChange: (SyntheticInputEvent<HTMLInputElement>) => void,
    children?: React.Node,
};
export const RadioLink = React.memo<RadioLinkProps>(function RadioLink(props) {
    return (
        <RadioLabel htmlFor={props.id} checked={props.checked} edgy={props.edgy} light={props.light}>
            <HiddenInput id={props.id} type={props.type}
                         value={props.id}
                         checked={props.checked} name={props.name}
                         onChange={props.onChange} />
            <RadioSelector light={!props.light}>
                {props.checked? 'X' : ' '}
            </RadioSelector>
            {props.children}
        </RadioLabel>
    )
});
