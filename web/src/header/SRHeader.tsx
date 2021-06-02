import * as React from 'react';
import styled, { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';

import { ReactComponent as LogoDark } from 'assets/logo/logo-dark-mode.svg';
import { ReactComponent as LogoLight } from 'assets/logo/logo-light-mode.svg';
import JoinButton from "./JoinButton";
import ThemeToggle from 'ThemeToggle';

const StyledHeader = styled.header`
    ${({theme}) =>
        `color: ${theme.colors.text}; background-color: ${theme.colors.background};`}
    padding-top: 1rem;
    height: 3.09rem;
    display: flex;
    align-items: center;
    @media all and (min-width: 768px) {
        height: 4rem;
    }
`;

const StyledDarkLogo = styled(LogoDark)`
    height: 2.25rem;
    width: auto;
    margin-top: auto;
    margin-bottom: auto;
    margin-right: 0.3em;
    @media all and (min-width: 768px) {
        height: 2.75rem;
        margin-right: 0.5em;
    }
`;

const StyledLightLogo = styled(LogoLight)`
    height: 2.25rem;
    width: auto;
    margin-top: auto;
    margin-bottom: auto;
    margin-right: 0.3em;
    @media all and (min-width: 768px) {
        height: 2.75rem;
        margin-right: 0.5em;
    }
`;

const SRTitle = styled.h1`
    font-size: 5.4vw;
    letter-spacing: 3px;
    margin: 0 auto;
    font-weight: 900;
    font-style: italic;
    display: flex;
    font-family: "Source Code Pro";
    color: ${({theme}) => theme.colors.title};
    user-select: none;

    margin-left: .75rem;
    @media all and (min-width: 768px) {
        letter-spacing: 4px;
        font-size: 2.25rem;
        text-align: center;
        margin-left: 1.5rem;
    }
`;

const ButtonSpacing = styled(UI.FlexRow).attrs(
    { spaced: true }
)`
    margin-left: auto;

    margin-right: 0.5rem;
    @media all and (min-width: 768px) {
        margin-right: 1.25rem;
    }
`;

type Props = {
    onClick: () => void
}

export default function SRHeader(props: Props) {
    const theme = React.useContext(ThemeContext);
    const logo = theme.colors.mode === "dark" ?
        <StyledDarkLogo /> : <StyledLightLogo />;
    return (
        <StyledHeader>
                <SRTitle>
                    {logo}
                    Shadowroller
                </SRTitle>
            <ButtonSpacing>
                <ThemeToggle />
                <JoinButton {...props} />
            </ButtonSpacing>
        </StyledHeader>
    );
}
