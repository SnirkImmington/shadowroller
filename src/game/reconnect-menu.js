// @flow


import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';

import * as Game from 'game';
import { statusFor, connectionFor, ConnectionCtx, SetConnectionCtx } from 'connection';

import * as server from 'server';
import * as srutil from 'srutil';

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

    return (
        <UI.Menu>
            <UI.ColumnToRow>
            <span>
                There was a problem connecting to the server.
            </span>
            <ButtonsRow>
                <UI.LinkButton>
                    Reconnect
                </UI.LinkButton>
                <UI.LinkButton>
                    Leave
                </UI.LinkButton>
            </ButtonsRow>
            </UI.ColumnToRow>
        </UI.Menu>
    );
}
