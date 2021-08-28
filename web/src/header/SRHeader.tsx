import * as React from 'react';
import styled, { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as layout from 'layout';
import * as Space from 'component/Space';

import { ReactComponent as LogoDark } from 'assets/logo/logo-dark-mode.svg';
import { ReactComponent as LogoLight } from 'assets/logo/logo-light-mode.svg';
import JoinButton from "./JoinButton";
import ThemeToggle from 'component/ThemeToggle';

const StyledHeader = styled.header({
    padding: `${layout.Space.Med}`,
    //height: "3.09rem",
    display: "flex",
    width: "100%",
    flexWrap: "wrap",
    alignItems: "center",
    gridColumn: 2,
    [layout.Media.Columns]: {
        gridColumn: "2 / span 2",
    }
});

const StyledDarkLogo = styled(LogoDark)({
    height: "2.25rem",
    width: "auto",
    marginRight: "0.5rem",
    [layout.Media.Columns]: {
        height: "2.75rem",
        marginRight: "1rem",
    }
});

const StyledLightLogo = styled(LogoLight)({
    height: "2.25rem",
    width: "auto",
    margin: "auto 0.5rem 0 0",
    // Columns: larger logo/text, higher margin
    [layout.Media.Columns]: {
        height: "2.75rem",
        marginRight: "1rem",
    }
});

const SRTitle = styled.h1(({ theme }) => ({
    fontSize: "clamp(1.5rem, 6vw, 2.25rem)",
    letterSpacing: "3px",
    fontWeight: 900,
    fontStyle: "italic",
    fontFamily: layout.Fonts.Monospace,
    color: theme.colors.title,
    userSelect: "none",

    [layout.Media.Columns]: {
        fontSize: "2.25rem",
        letterSpacing: "4px",
        textAlign: "center" // Does this do anything?
    }
}));

const ButtonSpacing = styled(UI.FlexRow).attrs({
    spaced: true, flexWrap: true
})({
    flexGrow: 1,
    paddingTop: "0.5rem"
});

type Props = {
    onClick: () => void
}

export default function SRHeader(props: Props) {
    const theme = React.useContext(ThemeContext);
    const logo = theme.colors.mode === "dark" ?
        <StyledDarkLogo /> : <StyledLightLogo />;
    return (
        <StyledHeader>
            <UI.FlexRow>
                {logo}
                <SRTitle>Shadowroller</SRTitle>
            </UI.FlexRow>
            <Space.FlexGrow />
            <ButtonSpacing>
                <Space.FlexGrow />
                <ThemeToggle />
                <JoinButton {...props} />
            </ButtonSpacing>
        </StyledHeader>
    );
}
