import * as React from 'react';
import styled, { CSSObject } from 'styled-components/macro';
//import * as styledSystem from 'styled-system';
import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/** CSS properties to set cursor to pointer. */
const hasPointer: CSSObject = {
    userSelect: "none",
    cursor: "pointer"
}

const StyledButton = styled.button(props => ({
    display: "inline",

    fontWeight: "bold",
    fontSize: props.theme.fontSizes.reg,
    lineHeight: 1,
    ...hasPointer,
    color: props.theme.colors.primary,
    backgroundColor: "transparent",

    border: 0,
    outline: 0,
    padding: "2px",
    borderBottom: `2px solid ${props.theme.colors.primary}`,
    whiteSpace: "pre",

    ":enabled:active": {
        filter: "brightness(85%)"
    },
    ":focus": {
        filter: "brightness(85%)"
    },

    ":disabled": {
        cursor: "not-allowed !important",
        borderBottom: "2px solid transparent",
        color: props.theme.colors.neutral,
    },
    ":enabled:hover": {
        filter: "brightness(125%)",
    },

    "& > svg:first-child": {
        marginRight: props.theme.space.tiny,
        height: "0.8em",
        width: "0.8em"
    },
}));

export const ButtonIcon = styled(FontAwesomeIcon)(props => ({
    marginRight: props.theme.space.small,
    height: "0.8em",
    width: "0.8em",
}));

export const MinorButton = styled(StyledButton)(props => ({
    color: props.theme.colors.secondary
}));

export type ButtonProps = {
    icon?: IconDefinition,
    children?: React.ReactChildren,
};
export function Button(props: ButtonProps) {
    if (props.icon) {
        return (
            <StyledButton>
                <ButtonIcon icon={props.icon} />
                {props.children}
            </StyledButton>
        );
    }
    return <StyledButton>{props.children}</StyledButton>
}
