import * as React from 'react';
import styled from 'styled-components/macro';

import * as Player from 'player';
import { RetryConnection, ConnectionCtx } from 'connection';

const StyledJoinButton = styled.button`
    border: 3px solid white;

    color: ${({ theme}) => theme.colors.highlight};
    background: ${({ theme }) => theme.colors.background};
    border: 3px solid;

    font-size: 1rem;
    font-weight: 500;
    padding: 0.1em 0.5em;
    text-align: center;
    text-decoration: none;
    cursor: pointer;

    &:enabled:hover {
        filter: brightness(115%);
    }

    &:enabled:active {
        filter: brightness(95%);
    }

    &:focus {
        filter: brightness(85%);
    }
`;

export type Props = {
    onClick: () => void
}

export default function JoinButton({ onClick }: Props) {
    const player = React.useContext(Player.Ctx);
    let connection: RetryConnection = React.useContext(ConnectionCtx);

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
                const connection_: never = connection; // eslint-ignore-line noUnusedLocals
                if (process.env.NODE_ENV !== "production") {
                    console.error("Invalid connection type:", connection_);
                }
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
