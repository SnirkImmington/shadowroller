import * as React from 'react';
import styled, { CSSObject } from 'styled-components/macro';

import * as layout from 'layout';

import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/** CSS properties to set cursor to pointer. */
const hasPointer: CSSObject = {
    userSelect: "none",
    cursor: "pointer"
}

type StyledButtonProps = {
    /** If the button should be displayed with a more passive color */
    minor?: boolean,
}

const StyledButton = styled.button<StyledButtonProps>(({ theme, minor }) => ({
    display: "inline",

    fontWeight: "bold",
    fontSize: layout.FontSize.Regular,
    lineHeight: 1,
    ...hasPointer,
    color: minor ? theme.colors.secondary : theme.colors.light,
    backgroundColor: "transparent",

    border: 0,
    outline: 0,
    padding: "2px",
    borderBottom: minor ? 0 : `2px solid ${theme.colors.light}`,
    whiteSpace: "pre",

    ":enabled:hover": {
        filter: "brightness(125%)",
    },
    ":enabled:active": {
        filter: "brightness(80%)"
    },
    ":focus": {
        filter: "brightness(85%)"
    },

    ":disabled": {
        cursor: "not-allowed",
        borderBottom: minor ? 0 : "2px solid transparent",
        color: theme.colors.neutral,
    },
}));

export const ButtonIcon = styled(FontAwesomeIcon)({
    marginRight: layout.Space.Small,
    height: "0.875em",
    width: "0.875em",
});

export const MinorButton = styled(StyledButton)(props => ({
    color: props.theme.colors.secondary
}));

export type ButtonProps = {
    icon?: IconDefinition,
};
export function Button(props: React.PropsWithChildren<ButtonProps>) {
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
