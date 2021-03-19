import styled from 'styled-components/macro';

import { ReactComponent as Logo } from 'assets/logo/logo-dark-mode.svg';
import JoinButton from "./JoinButton";

const StyledHeader = styled.header`
    background-color: ${({theme}) => theme.colors.header};
    height: 3rem;
    color: white;
    display: flex;
    align-items: center;
`;

const StyledLogo = styled(Logo)`
    height: 2rem;
    width: auto;
    margin-top: auto;
    margin-bottom: auto;
    margin-right: 0.3em;
    @media all and (min-width: 768px) {
        margin-right: 0.5em;
    }
`;

const SRTitle = styled.h1`
    font-size: 2rem;
    font-style: oblique;
    font-weight: 900;
    letter-spacing: 1px;
    text-align: center;
    display: flex;

    margin-left: .5rem;
    @media all and (min-width: 768px) {
        margin-left: 3.5rem;
    }
`;

type Props = {
    onClick: () => void
}

export default function SRHeader(props: Props) {
    return (
        <StyledHeader>
                <SRTitle>
                    <StyledLogo />
                    Shadowroller
                </SRTitle>
            <JoinButton {...props} />
        </StyledHeader>
    );
}
