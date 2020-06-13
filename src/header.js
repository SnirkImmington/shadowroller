// @flow

import * as React from 'react';
import type { StyledComponent } from 'styled-components';
import styled from 'styled-components/macro';

import * as Game from 'game';
import * as server from 'server';

const SRHeader: StyledComponent<> = styled.header`
    background-color: ${({theme}) => theme.colors.header};
    height: 3.4rem;
    color: white;
    display: flex;
    align-items: center;
`;

const SRTitle = styled.h1`
    font-size: 2em;
    font-style: oblique;
    font-weight: 900;
    letter-spacing: 1.2px;

    margin-left: .5rem;
    @media all and (min-width: 768px) {
        margin-left: 8rem;
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
    align-text: center;
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
    +connection: server.Connection,
    +menuShown: bool,
    +onClick: () => void
}

function JoinButton({ connection, menuShown, onClick }: Props) {
    const game = React.useContext(Game.Ctx);
    let disabled = false;
    let message: React.Node = "";
    if (!game) {
        switch (connection) {
            case "offline":
            case "disconnected":
                message = menuShown ? "Cancel" : "Join";
                break;
            case "connecting":
                message = menuShown ? "Cancel" : "Connecting";
                disabled = !menuShown;
                break;
            case "connected": // We should have a game if we're connected.
                message = "Error!";
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
            case "connecting":
                message = menuShown ? "Cancel" : "Reconnecting";
                disabled = !menuShown;
                break;
            case "connected":
                message = menuShown ? "Close" : game.player.name;
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
            <SRTitle>Shadowroller</SRTitle>
            <JoinButton {...props} />
        </SRHeader>
    );
}
