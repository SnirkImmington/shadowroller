// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';

import * as Game from 'game';
import * as Event from 'event';
import { statusFor, connectionFor, ConnectionCtx, SetConnectionCtx } from 'connection';
import * as server from 'server';
import * as srutil from 'srutil';
import routes from 'routes';

const ERROR_FLAVOR = [
    "Looks like we're having some issues",
];

const MenuLayout = styled(UI.FlexRow)`
    @media all and (min-width: 768px) {
        padding: 0 0 0.5em;
        align-items: center;
    }

    & > * {
        @media all and (min-width: 768px) {
            margin-top: auto;
            margin-bottom: auto;
        }
    }

    & > *:first-child {
        @media all and (min-width: 768px) {
            flex-grow: 1;
            justify-content: flex-start;
        }
    }
`;

const ButtonsRow = styled(UI.FlexRow)`
    /* Mobile: buttons on right */
    margin-left: auto;

    & > * {
        margin-left: 0.5em;
    }

    @media all and (min-width: 768px) {
        align-items: center;
    }
`;

type Props = {
    +hide: () => void,
}
export function ReconnectMenu({ hide }: Props) {
    const game = React.useContext(Game.Ctx);
    const connection = React.useContext(ConnectionCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);

    function handleReconnect(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();

        // This is the only way to close the event stream
        gameDispatch({ ty: "leave" });
        // flow-ignore-all-next-line We don't render this if (!server.session)
        routes.auth.reauth({ session: server.session })
            .onConnection(setConnection)
            .onResponse(resp => {
                hide();
                server.handleLogin(
                    false, resp, setConnection, gameDispatch, eventDispatch
                );
            })
        setConnection("connecting");
    }

    function handleLeave(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();

        server.handleLogout(gameDispatch, eventDispatch);
        setConnection("offline");
    }

    const buttonsEnabled = connection !== "connecting";

    return (
        <UI.Menu>
            <form id="reconnect-menu-form">
            <UI.MenuBody>
                <span>
                There was a problem connecting to the server.
                </span>
                <ButtonsRow>
                    <UI.LinkButton light id="reconnect-to-game"
                                   onClick={handleReconnect}
                                   disabled={!buttonsEnabled}>
                        Reconnect
                    </UI.LinkButton>
                    <UI.LinkButton light id="leave-game"
                                   onClick={handleLeave}
                                   disabled={!buttonsEnabled}>
                        Log out
                    </UI.LinkButton>
                </ButtonsRow>
            </UI.MenuBody>
            </form>
        </UI.Menu>
    );
}
