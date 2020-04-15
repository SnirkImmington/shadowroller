// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import type { Connection } from 'connection';

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

type Props = {
    connection: Connection,
    setConnection: (Connection) => void,
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
            .catch(err => {
                if (process.env.NODE_ENV !== "production") {
                    console.log("Error connecting")
                }
                setConnection("offline");
            })
        setConnection("connecting");
    }

    return (
        <UI.CardWrapper color="dimGray">
            Join a game if you've been given a Game ID.
            <form id="join-game-menu">

            </form>
        </UI.CardWrapper>
    )
}
