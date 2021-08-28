import styled, { CSSObject } from 'styled-components/macro';

import * as layout from 'layout';
import * as styles from 'component/styling';
import { Disableable } from 'component/props';

/** An input which is hidden visually, for use with radio and check boxes. */
export const HiddenInput = styled.input<Disableable>({
    position: "absolute",
    opacity: 0,
    height: 0,
    width: 0,
    cursor: "pointer",
});

/** Label is a label which has a thematic color scheme, and a flag to
    display as disabled. */
export const Label = styled.label<Disableable>(({ theme, disabled }) => {
    const style: CSSObject = {
        display: "inline-flex",

        lineHeight: 1.5,
        whiteSpace: "pre",
        fontSize: layout.FontSize.Regular,
        fontFamily: layout.Fonts.Monospace,

        borderBottom: "1px solid transparent",

        ...styles.userPointer,

        ":hover": {
            borderBottom: `1px solid ${theme.colors.primary}`,
        },
        ":focus": {
            filter: "brightness(90%)",
        },
        ":active": {
            filter: "brightness(85%)", // TODO should this be swapped?
        },
    };
    // Disabled is the slow path
    if (disabled) {
        style.textDecorationLine = "line-through";
        style.cursor = "not-allowed !important";
        delete style[":hover"];
        delete style[":focus"];
        delete style[":active"];
    }
    return style;
});

/** Brackets is the brackets (paren or square) that represent a selector. */
export const Brackets = styled.span.attrs<Disableable>({
    ariaHidden: true,
    role: "presentation",
})<Disableable>(({ theme, disabled }) => ({
    lineHeight: 1.5,
    fontSize: layout.FontSize.Regular,
    fontFamily: layout.Fonts.Monospace,
    fontWeight: "bold",

    color: disabled ? theme.colors.neutral : theme.colors.secondary, // TODO maybe wanted DieOne here
    textAlign: "center",

    marginRight: layout.Space.Tiny,
    textDecorationLine: disabled ? "line-through" : "none",
}));

/** Indicator is the inner X or space used to indicate a selector is selected */
export const Indicator = styled.b(({theme}) => ({
    color: theme.colors.light,
    whiteSpace: "nowrap",
}));
