// @flow

import * as React from 'react';
import type { StyledComponent } from 'styled-components';
import styled from 'styled-components/macro';
import * as UI from 'style';

import * as Game from 'game';
import * as server from 'server';

const SRHeader: StyledComponent<> = styled.header`
    background-color: #222;
    height: 4.6rem;
    color: white;
    display: flex;
    align-items: center;

    @media all and (min-width: 768px) {
        height: 3.4rem;
    }
`;

const SRTitle = styled.h1`
    font-size: 2em;
    font-style: oblique;
    font-weight: 900;

    margin-left: .5rem;
    @media all and (min-width: 768px) {
        margin-left: 8rem;
    }
`;

const JoinButtonUI = styled(UI.Button)`
    color: white;
    background: #222;
    border: 3px solid white;

    color: ${props => props.expanded ? '#222' : 'white'};
    background: ${props =>props.expanded ? 'white' : '#222'};
    border: 3px solid ${props=>props.expanded ? '#222' : 'white'};

    margin-left: auto;

    margin-right: 0.25em;
    @media all and (min-width: 768px) {
        margin-right: 4em;
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
    +game: Game.State,
    +connection: server.Connection,
    +menuShown: bool,
    +onClick: () => void
}

function JoinButton({ game, connection, menuShown, onClick }: Props) {
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
                message = menuShown ? "Close" : <UI.PlayerName id={game.player.id} name={game.player.name} />;
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
