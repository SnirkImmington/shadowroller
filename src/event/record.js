// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import { PlayerName } from 'style';

import * as Game from 'game';
import * as Event from 'event';

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

export function LocalRollRecord({ event }: { event: Event.LocalRoll }) {
    return (
        <DiceRecord>
            {`Rolled ${event.dice.length} dice`}
            <DiceList dice={event.dice} showNumbers={false} />
        </DiceRecord>
    );
}

export function GameRollRecord({ event }: { event: Event.GameRoll }) {
    const game = React.useContext(Game.Ctx);
    console.log("Record for", game);
    const playerName = game?.players.get(event.playerID) ?? "Missingno";
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

export function GameJoinRecord({ event }: { event: Event.GameJoin }) {
    const formattedID: React.Node = <tt>{event.gameID}</tt>
    return (
        <SimpleRecord color="mediumseagreen">
            {`Joined `}{formattedID}
        </SimpleRecord>
    );
}

export function GameConnectRecord({ event }: { event: Event.GameConnect }) {
    return (
        <SimpleRecord>
            {`${event.connected ? 'Connected to' : 'Disconnected from'} game`}
        </SimpleRecord>
    );
}

export function PlayerJoinRecord({ event }: { event: Event.PlayerJoin }) {
    return (
        <SimpleRecord color={srutil.hashedColor(event.player.id)}>
            {`${event.player.name} joined the game.`}
        </SimpleRecord>
    );
}
