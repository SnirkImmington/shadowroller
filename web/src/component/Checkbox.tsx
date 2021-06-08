import * as React from 'react';
import styled, { CSSObject } from 'styled-components/macro';

import * as layout from 'layout';

import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// This in particular seems to slow compilation down
// styled.input(props => props)(...)
const HiddenInput = styled.input({
    position: "absolute",
    opacity: 0,
    height: 0,
    width: 0,
});

const RadioSelector = styled.span<{ disabled?: boolean }>(({ theme }) => ({
    lineHeight: 1.5,
    fontSize: layout.FontSize.Regular,
    fontFamily: layout.Fonts.Monospace,
    fontWeight: "bold",
    color: theme.colors.secondary,
    textAlign: "center",
    marginRight: layout.Space.Tiny,

    ":disabled": {
        color: theme.colors.neutral
    }
}));

const RadioWrapper = styled.label(({ theme }) => ({
    display: "inline-flex",
    lineHeight: 1.5,
    fontSize: layout.FontSize.Regular,
    cursor: "pointer !important",
    userSelect: "none",
    whiteSpace: "pre",
    fontFamily: layout.Fonts.Monospace,
    borderBottom: "1px solid transparent",

    ":enabled:hover": {
        borderBottom: `1px solid ${theme.colors.primary}`
    },
    ":enabled:active": {
        filter: "brightness(85%)",
    },
    ":focus": {
        filter: "brightness(90%)",
    },
    ":disabled": {
        cursor: "not-allowed !important",
        borderBottom: `1px solid ${theme.colors.primary}`
    },
}));

const LinkX = styled.b(({theme}) => ({
    color: theme.colors.light
}));

export type RadioProps = React.PropsWithChildren<{
    id: string,
    disabled?: boolean,
}>
export default function Radio(props: RadioProps) {
    return (
        <RadioWrapper htmlFor={props.id} disabled={props.disabled}>
            <HiddenInput disabled={props.disabled} />
            <RadioSelector disabled={props.disabled}>
            </RadioSelector>
            {props.children}
        </RadioWrapper>
    )
}
