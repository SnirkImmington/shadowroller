// @flow

import * as React from 'react';
import type { StyledComponent } from 'styled-components';
import styled from 'styled-components/macro';

import * as Game from 'game';
import { ConnectionCtx } from 'connection';
// flow-ignore-all-next-line
import { ReactComponent as DieOne } from 'assets/die-1.svg';

const SRHeader: StyledComponent<> = styled.header`
    background-color: ${({theme}) => theme.colors.header};
    height: 3.4rem;
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
    font-size: 2em;
    font-style: oblique;
    font-weight: 900;
    letter-spacing: 1px;
    align-text: center;
    display: flex;


    margin-left: .5rem;
    @media all and (min-width: 768px) {
        margin-left: 4rem;
    }
`;

const JoinButtonUI = styled.button`
    background: ${({theme}) => theme.colors.header};
    border: 3px solid white;

    color: ${({expanded, theme}) => expanded ? theme.colors.header : 'white'};
    background: ${({expanded, theme}) => expanded ? 'white' : theme.colors.header};
    border: 3px solid;

    font-size: 1rem;
    font-weight: 500;
    padding: 0.2em 0.75em;
    text-align: center;
    cursor: pointer;

    margin-left: auto;

    margin-right: 0.5rem;
    @media all and (min-width: 768px) {
        margin-right: 4rem;
    }

    &:hover {
        background: #333;
        text-decoration: none;
    }

    &:active {
        background: #444;
    }
`;

type Props = {
    +menuShown: bool,
    +onClick: () => void
}

function JoinButton({ menuShown, onClick }: Props) {
    const game = React.useContext(Game.Ctx);
    const connection = React.useContext(ConnectionCtx);

    let disabled = false;
    let message: React.Node = "";
    if (!game) {
        switch (connection) {
            case "offline":
            case "disconnected":
                message = menuShown ? "Cancel" : "Join";
                break;
            case "connecting":
            case "connected": // If we don't have a game yet
                message = menuShown ? "Cancel" : "Connecting";
                disabled = !menuShown;
                break;
            case "errored":
                message = "Try again";
                break;
            default:
                (connection: empty); // eslint-disable-line no-unused-expressions
        }
    }
    else { // Connected to game
        switch (connection) {
            case "offline":
            case "disconnected":
                message = menuShown ? "Close" : "Disconnected";
                break;
            case "connected":
            case "connecting":
                message = menuShown ? "Close" : game.player.name;
                disabled = connection == "connecting" && !menuShown;
                break;
            case "errored":
                message = "Error";
                break;
            default:
                (connection: empty); // eslint-disable-line no-unused-expressions
        }
    }

    return (
        <JoinButtonUI disabled={disabled} onClick={onClick}>
            {message}
        </JoinButtonUI>
    );
}

export default function Header(props: Props) {
    return (
        <SRHeader>
                <SRTitle>
                    <StyledDie />
                    Shadowroller
                </SRTitle>
            <JoinButton {...props} />
        </SRHeader>
    );
}
