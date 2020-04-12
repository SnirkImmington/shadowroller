// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import { PlayerName } from 'style';

import { GameCtx } from 'game/state';
import type { GameJoinEvent, LocalRollEvent, GameConnectEvent, GameRollEvent, PlayerJoinEvent } from 'event/state';
import DiceList from 'roll/components/dice-list';
import * as srutil from 'srutil';

function DiceRecord({ children }: { children: React.Node[] }) {
    return (
        <div>
            <div>[ {children[0]} </div>
            <div>{children[1]}</div>
        </div>
    );
}

type SimpleRecordProps = { color?: string, children: React.Node | React.Node[] };
const SimpleRecord: StyledComponent<SimpleRecordProps> = styled.div`
    margin: .25em 0px;
    padding: 5px;
    ${props => props?.color ?
        `border-left: 5px solid ${props.color};
         background-image: linear-gradient(to right, ${props.color}, white 0.4%)` : ''
    }
`;

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
        <SimpleRecord color="mediumseagreen">
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
        <SimpleRecord color={srutil.hashedColor(event.player.id)}>
            {`${event.player.name} joined the game.`}
        </SimpleRecord>
    );
}
