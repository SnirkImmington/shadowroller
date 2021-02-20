import * as React from 'react';
import styled from 'styled-components/macro';

import { ReactComponent as DieOne } from 'assets/die-1.svg';
import JoinButton from "./JoinButton";

const StyledHeader = styled.header`
    background-color: ${({theme}) => theme.colors.header};
    height: 2.6rem;
    @media all and (min-width: 768px) {
        height: 2.56rem;
    }
    color: white;
    display: flex;
    align-items: center;
`;

const StyledDie = styled(DieOne)`
    height: 1em;
    width: 1em;
    margin-top: auto;
    margin-bottom: auto;
    margin-right: .25em;
    color: ${({theme}) => theme.colors.primaryLight};
`;

const SRTitle = styled.h1`
    font-size: 1.5em;
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
                    <StyledDie />
                    Shadowroller
                </SRTitle>
            <JoinButton {...props} />
        </StyledHeader>
    );
}
