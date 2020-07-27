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

const ButtonsRow = styled(UI.FlexRow)`
    /* Mobile: buttons on right */

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

    function handleReconnect(event: SyntheticInputEvent<HTMLInputElement>) {
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

    function handleLeave() {

    }

    const buttonsEnabled = connection !== "connecting";

    return (
        <UI.Menu>
            <UI.ColumnToRow>
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
            </UI.ColumnToRow>
        </UI.Menu>
    );
}
