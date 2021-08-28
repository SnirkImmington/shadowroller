import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import * as layout from 'layout';
import * as styles from 'component/styling';

/** Button.Icon is an icon which is spaced to work as the first element in a button. */
export const Icon = styled(FontAwesomeIcon)({
    marginRight: "0.15em",
    height: "0.8em",
    width: "0.8em",
});

export type Props = {
    padBottom?: boolean,
}

/** Button.Main is a button which is styled like a link. */
export const Main = styled.button<Props>(({ padBottom, theme }) => ({
    display: "inline",

    fontWeight: "bold",
    color: theme.colors.light,
    fontSize: layout.FontSize.Regular,
    lineHeight: 1,
    whiteSpace: "pre",
    ...styles.userPointer,

    backgroundColor: "transparent",
    border: 0,
    outline: 0,
    padding: "2px",
    textDecoration: "underline 2px",

    paddingBottom: padBottom ? "0.25rem" : "0",

    ":enabled:hover": {
        filter: "brightness(115%)",
    },
    ":enabled:active": {
        filter: "brightness(80%)"
    },
    ":focus": {
        filter: "brightness(85%)"
    },

    ":disabled": {
        cursor: "not-allowed",
        textDecoration: "none",
        color: theme.colors.neutral,
    },
}));

/** Button.Minor is a button which is rendered in a subdued way. */
export const Minor = styled(Main)(({ theme }) => ({
    textDecoration: "none",
    color: theme.colors.secondary,
}));
