// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';

import * as server from 'server';
import * as srutil from 'srutil';

const JOIN_FLAVOR = [
    "See you on the flip side.",
    "Good luck out there.",
];

const LOADING_FLAVOR = [
    "Hacking you in...",
    "Acquiring marks...",
    "Authenticating...",
    "Acquiring intel...",
    "Starting the run...",
    "Contacting Mr. J...",
    "Hack on the Fly-ing...",
    "Brute Force-ing...",
];

const MenuLayout = styled(UI.ColumnToRow)`

    @media all and (min-width: 768px) {
        align-items: center;
    }
`;

type Props = {
    connection: server.Connection,
    setConnection: server.SetConnection,
    dispatch: Game.Dispatch
};
export function JoinMenu({ connection, setConnection, dispatch }: Props) {
    const [gameID, setGameID] = React.useState('');
    const [playerName, setPlayerName] = React.useState('');

    const ready = gameID !== '' && playerName !== '';

    function onGameIDChange(event: SyntheticInputEvent<HTMLInputElement>) {
        setGameID(event.target.value ?? '');
    }
    function onPlayerNameChange(event: SyntheticInputEvent<HTMLInputElement>) {
        setPlayerName(event.target.value ?? '');
    }

    function onSubmit(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        if (!ready) { return; }

        server.requestJoin(gameID, playerName)
            .then(resp => {
                dispatch({
                    ty: "join",
                    gameID: gameID,
                    player: { id: resp.playerID, name: playerName },
                    players: resp.players
                });
                setConnection("connected");
            })
            .catch((err: mixed) => {
                if (process.env.NODE_ENV !== "production") {
                    console.log("Error connecting", err);
                }
                setConnection("offline");
            })
        setConnection("connecting");
    }

    return (
        <UI.Menu color="dimGray">
            <form id="join-game-menu">
                <MenuLayout>
                    <span>
                        Join a game if you've been given a Game ID.
                    </span>
                    <UI.FlexRow>
                        <UI.Input monospace id="join-game-id"
                                  placeholder={"Game ID"}
                                  value={gameID} onChange={onGameIDChange}
                                  disabled={connection === "connecting"} />
                        <UI.Input id="join-player-name"
                                  placeholder={"Player name"}
                                  value={playerName} onChange={onPlayerNameChange}
                                  disabled={connection === "connecting"} />

                    </UI.FlexRow>
                    <UI.FlexRow>
                        <span>
                            Flavortext breh
                        </span>
                        <button id="join-game-submit" onClick={onSubmit}
                                disabled={!ready}>
                            Join
                        </button>
                    </UI.FlexRow>
                </MenuLayout>
            </form>
        </UI.Menu>
    )
}
