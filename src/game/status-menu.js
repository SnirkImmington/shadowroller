// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import * as Game from 'game';
import * as Event from 'event';
import * as server from 'server';
import { SetConnectionCtx } from 'connection';

const Message = styled.p`
    margin: 0 0.5em;

    @media all and (min-width: 768px) {
        margin-left: 2rem;
    }
`;

const LeaveButton = styled(UI.LinkButton)`
    margin-left: auto;
    margin-right: .5rem;
    @media all and (min-width: 768px) {
        margin-left: 0px;
    }
`;

type Props = {
    hide: () => void;
}
export function StatusMenu({ hide }: Props) {
    const game = React.useContext(Game.Ctx);
    const dispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx);

    if (!game) {
        return 'Something messed up, maybe press the join button again?';
    }

    function handleLeave() {
        server.handleLogout(dispatch, eventDispatch);
        setConnection("offline");
    }

    return (
        <UI.Menu>
            <UI.FlexRow>
                <Message>
                    Connected to {game.gameID} as {' '}
                    <UI.HashColored light id={game.player.id}>
                        {game.player.name}
                    </UI.HashColored>.
                </Message>
                <LeaveButton light onClick={handleLeave}>
                    Log Out
                </LeaveButton>
            </UI.FlexRow>
        </UI.Menu>
    );
}
