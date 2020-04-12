// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import { PlayerName } from 'style';

import { GameCtx } from 'game/state';
import type { GameJoinEvent, LocalRollEvent, GameConnectEvent, GameRollEvent, PlayerJoinEvent } from 'event/state';
import DiceList from 'roll/components/dice-list';

function DiceRecord({ children }: { children: React.Node[] }) {
    return (
        <div>
            <div>[ {children[0]} </div>
            <div>{children[1]}</div>
        </div>
    );
}

function SimpleRecord({ children }: { children: React.Node | React.Node[] }) {
    return (
        <div>
            {children}
        </div>
    );
}

export function LocalRollRecord({ event }: { event: LocalRollEvent }) {
    return (
        <DiceRecord>
            {`Rolled ${event.dice.length} dice`}
            <DiceList dice={event.dice} showNumbers={false} />
        </DiceRecord>
    );
}

export function GameRollRecord({ event }: { event: GameRollEvent }) {
    const game = React.useContext(GameCtx);
    console.log("Record for", game);
    const playerName = game?.players[event.playerID] ?? "Missingno";
    return (
        <DiceRecord>
            <>
            <PlayerName id={event.playerID} name={playerName} />
            {` rolls ${event.dice.length} dice...`}
            </>
            <DiceList dice={event.dice} showNumbers={false} />
        </DiceRecord>
    );
}

export function GameJoinRecord({ event }: { event: GameJoinEvent }) {
    const formattedID: React.Node = <tt>{event.gameID}</tt>
    return (
        <SimpleRecord>
            {`Joined `}{formattedID}
        </SimpleRecord>
    );
}

export function GameConnectRecord({ event }: { event: GameConnectEvent }) {
    return (
        <SimpleRecord>
            {`${event.connected ? 'Connected to' : 'Disconnected from'} game`}
        </SimpleRecord>
    );
}

export function PlayerJoinRecord({ event }: { event: PlayerJoinEvent }) {
    return (
        <SimpleRecord>
            {`${event.player.name} joined the game.`}
        </SimpleRecord>
    );
}
