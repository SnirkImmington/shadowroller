import styled from 'styled-components/macro';
import * as layout from 'layout';

type InputProps = {
    /** type is the HTML type of the input */
    type?: string,
    /** expand determines if the input should be displayed wider. */
    expand?: boolean,
    /** monospace sets the input to render monospace text, for code-like user
        input, such as a game ID or number. */
    monospace?: boolean,
}

/** Input is a text or other input field, styled to be simple and use theme colors. */
export default styled.input.attrs(props => ({
    type: props.type ?? "text",
}))<InputProps>(({ monospace, expand, theme }) => ({
    height: "calc(1em + 10px)",
    margin: `0 ${layout.Space.Small}`,
    border: `1px solid ${theme.colors.neutral}`,
    padding: "5px",
    color: theme.colors.text,
    background: theme.colors.background,

    lineHeight: 1,
    fontFamily: monospace ? layout.Fonts.Monospace : "inherit",
    fontSize: layout.FontSize.Regular,
    maxWidth: expand ? "100%" : "14em",

    ":focus": {
        outline: `1px solid ${theme.colors.highlight}`,
        border: `1px solid ${theme.colors.highlight}`,
    },
    ":disabled": {
        cursor: "not-allowed !important",
        color: theme.colors.neutral,
        filter: "brightness(75%)",
    }
}));
