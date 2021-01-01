// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import * as Game from 'game';
import * as Event from 'history/event';
import * as Stream from '../stream';
import { ConnectionCtx, SetConnectionCtx } from 'connection';
import * as server from 'server';
import routes from 'routes';

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
    const connection = React.useContext(ConnectionCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const stream = React.useContext(Stream.Ctx);
    const setStream = React.useContext(Stream.SetterCtx);
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
            })
            .onClientError(resp => {
                if (process.env.NODE_ENV !== "production") {
                    console.log("Got client error for reauth: ", resp);
                }
                server.clearSession();
                setConnection("offline");
            });
        setConnection("connecting");
    }

    function handleLeave(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
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
