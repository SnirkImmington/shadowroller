import * as React from 'react';
import styled, { StyledComponent } from 'styled-components/macro';

import * as Player from 'player';
import { RetryConnection, ConnectionCtx } from 'connection';

type ButtonProps = {
    expanded?: boolean
};

const StyledJoinButton: StyledComponent<"button", any, ButtonProps> = styled.button`
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

export type Props = {
    onClick: () => void
}

export default function JoinButton({ onClick }: Props) {
    const player = React.useContext(Player.Ctx);
    let connection: RetryConnection | false | true = React.useContext(ConnectionCtx);
    if (Math.random()) {
        connection = false;
    }

    let disabled = false;
    let message: React.ReactNode = "";
    if (!player) {
        switch (connection) {
            case "offline":
                message = "Join";
                break;
            case "disconnected":
                message = "Reconnect";
                break;
            case "connecting":
            case "connected": // Connected but no player - race condition between setStates?
                message = "Connecting";
                disabled = true;
                break;
            case "errored":
                message = "Try again";
                break;
            case "retrying":
                message = "Reconnecting";
                break;
            default:
                const _: never = connection; // eslint-ignore-line noUnusedLocals
        }
    }
    else { // Connected to game
        switch (connection) {
            case "offline":
            case "disconnected":
                message = "Disconnected";
                break;
            case "connecting":
                message = player.name;
                disabled = true;
                break;
            case "connected":
            case "retrying":
                message = player.name;
                break;
            case "errored":
                message = "Error";
                break;
        }
    }

    return (
        <StyledJoinButton disabled={disabled} onClick={onClick}>
            {message}
        </StyledJoinButton>
    );
}
