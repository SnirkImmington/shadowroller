// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import { PlayerName } from 'style';

import type { GameJoinEvent, LocalRollEvent, GameConnectEvent, GameRollEvent, PlayerJoinEvent } from 'event/state';
import DiceList from 'roll/components/dice-list';

function DiceRecord({ children }) {
    return (
        <div>
            <div>[ {children[0]} </div>
            <div>{children[1]}</div>
        </div>
    );
}

function SimpleRecord({children}) {
    return (
        <div>
            {children}
        </div>
    );
}

export function LocalRollRecord({ event }: { event: LocalRollEvent }) {
    return (
        <DiceRecord>
            {`Rolled ${event.dice.legnth} dice`}
            <DiceList dice={event.dice} showNumbers={false} />
        </DiceRecord>
    );
}

export function GameRollRecord({ event }: { event: GameRollEvent }) {
    return (
        <DiceRecord>
            <>
            <PlayerName id={event.playerID} name={event.playerName} />
            {` rolls ${event.dice.length} dice...`}
            </>
            <DiceList dice={event.dice} showNumbers={false} />
        </DiceRecord>
    );
}

export function GameJoinRecord({ event }: { event: GameJoinEvent }) {
    return <SimpleRecord>
        {`Joined ${event.gameID}`}
    </SimpleRecord>;
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
