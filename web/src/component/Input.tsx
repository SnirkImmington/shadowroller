import * as React from 'react';
import styled from 'styled-components/macro';

type InputProps = {
    type?: string,
    expand?: boolean,
    monospace?: boolean,
}

export const Input = styled.input.attrs(props => ({
    type: props.type ?? "text",
}))<InputProps>(props => ({
    height: "calc(1em + 10px)",
    margin: `0 ${props.theme.space.small}`,
    padding: "5px",

    lineHeight: 1,
    fontFamily: props.monospace ? '"Source Code Pro", monospace' : 'monospace',
    fontSize: props.theme.fontSizes.regular,

    border: `1px solid ${props.theme.colors.neutral}`,
    ":focus": {
        outline: `1px solid ${props.theme.colors.highlight}`,
        border: `1px solid ${props.theme.colors.highlight}`,
    }
}));
