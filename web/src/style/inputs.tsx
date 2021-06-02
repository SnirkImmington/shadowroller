import * as React from 'react';
import styled from 'styled-components/macro';

type InputProps = {
    monospace? : boolean,
    expand?: boolean,
    type?: string
};
export const Input = styled.input.attrs(props => ({
    type: props.type ?? "text",
}))<InputProps>`
    ${({theme}) => `color: ${theme.colors.text}; background-color: ${theme.colors.background};`}

    font-family: ${({ monospace }) => monospace ? '"Source Code Pro", monospace' : "inherit"};
    max-width: ${({ expand }) => expand ? '100%' : '14em'};
    height: calc(1em + 10px);

    margin: 0px 0.5em;
    border: 1px solid lightslategray;
    padding: 5px;
    line-height: 1;
    font-size: 1em;

    &:focus {
        outline: 1px solid ${props => props.theme.colors.outline};
        border: 1px solid ${props => props.theme.colors.outline};
    }

    &:disabled: {
        cursor: not-allowed !important;
        color: ${({theme}) => theme.colors.neutral};
        filter: brightness(75%);
    }
`;

type LinkButtonProps = {
    minor?: boolean,
    light?: boolean,
}
export const LinkButton = styled.button<LinkButtonProps>`
    display: inline;
    font-weight: bold;
    font-size: 1em;
    line-height: 1;

    user-select: none;
    cursor: pointer;
    color: ${({ minor, theme }) =>
        minor ? theme.colors.secondary : theme.colors.light
    };
    background-color: transparent;
    border: 0;
    ${({ minor, theme }) => !minor &&
        `border-bottom: 1.5px solid ${minor ? theme.colors.secondary : theme.colors.light};`
    }
    outline: 0;
    padding: 2px;
    white-space: pre;

    &:disabled {
        cursor: not-allowed !important;
        text-decoration: none;
        border-bottom: 2px solid transparent;
        color: ${({theme}) => theme.colors.neutral};
    }

    &:enabled:hover {
        filter: brightness(115%);
    }

    &:enabled:active {
        filter: brightness(90%);
    }

    &:focus {
        filter: brightness(85%);
    }

    & > svg:first-child {
        margin-right: 0.2em;
        height: 0.8em;
        width: 0.8em;
    }
`;

const HiddenInput = styled.input.attrs(props => ({
    checked: props.checked,
    name: props.name,
    id: props.id, type: props.type,
    value: props.value, disabled: props.disabled,
}))`
    position: absolute;
    opacity: 0;
    height: 0;
    width: 0;
`;

// color: light? secondaryDark : primaryDesaturated
const RadioSelector = styled.span<{ light?: boolean, disabled?: boolean }>`
    line-height: 1.5;
    font-family: ${({theme}) => theme.fonts.monospace};
    font-weight: bold;
    color: ${({theme}) => theme.colors.secondary};
    text-align: center;
    margin-right: 0.2em;

    &:disabled {
        color: ${({ theme }) => theme.colors.dieOne};
    }
`;

const RadioLabel = styled.label<{ disabled?: boolean }>`
    display: inline-flex;
    line-height: 1.5;
    font-size: 1em;
    cursor: pointer !important;
    user-select: none;
    white-space: pre;
    font-family: ${({theme}) => theme.fonts.monospace};
    border-bottom: 1px solid transparent;

    ${({ disabled, theme }) => disabled ?
        `
        text-decoration: line-through;
        cursor: not-allowed !important;
        ` :
        `
        &:active {
            filter: brightness(90%);
        }

        &:hover {
            border-bottom: 1px solid ${theme.colors.primary};
        }
        `
    }
`;

const LinkX = styled.b(props => ({
    color: props.theme.colors.light,
}));

type RadioLinkProps = {
    id: string,
    name?: string,
    light?: boolean,
    type: "checkbox" | "radio",
    checked: boolean,
    value?: string,
    disabled?: boolean,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
};
export const RadioLink = React.memo<React.PropsWithChildren<RadioLinkProps>>(function RadioLink(props) {
    return (
        <RadioLabel htmlFor={props.id} disabled={props.disabled}>
            <HiddenInput {...props} children={undefined} />
            <RadioSelector light={!props.light} disabled={props.disabled}>
                <span aria-hidden="true">
                    {props.type === "checkbox" ? "[" : "("}
                    {props.checked ? <LinkX>X</LinkX> : ' '}
                    {props.type === "checkbox" ? "]" : ")"}
                </span>
            </RadioSelector>
            {props.children}
        </RadioLabel>
    )
});
