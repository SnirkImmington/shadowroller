// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Game from 'game';
import * as Event from 'event';

import DiceList from 'roll/components/dice-list';
import * as srutil from 'srutil';

type SingleRecordProps = {
    color?: string,
    children: React.Node | React.Node[]
};
const SingleRecord: StyledComponent<SingleRecordProps> = styled(UI.FlexRow)`
    margin: .3em 0px;
    padding: 2px 4px;
    ${props => props?.color ? `
        border-left: 6px solid ${props.color};
        border-right: 6px solid ${props.color};
    ` : ''
    }
`;

const DoubleRecord: StyledComponent<SingleRecordProps> = styled(SingleRecord)`
    flex-direction: column;
    align-items: flex-start;
`;

export function LocalRollRecord({ event }: { event: Event.LocalRoll }) {
    return (
        <DoubleRecord color="slateGray">
            {`Rolled ${event.dice.length} dice`}
            <DiceList dice={event.dice} showNumbers={false} />
        </DoubleRecord>
    );
}

export function GameRollRecord({ event }: { event: Event.GameRoll }) {
    // TODO This component will re-render whenever game state changes.
    // It may be worth splitting players out of game state eventually.
    const game = React.useContext(Game.Ctx);
    let playerName = "Missingno";
    if (game) {
        playerName = game.players.get(event.playerID) || playerName;
    }

    return (
        <DoubleRecord color={srutil.hashedColor(event.playerID)}>
            <span>
                <UI.PlayerName id={event.playerID} name={playerName} />
                {` rolls ${event.dice.length} dice`}
            </span>
            <DiceList dice={event.dice} showNumbers={false} />
        </DoubleRecord>
    );
}

export function GameJoinRecord({ event }: { event: Event.GameJoin }) {
    const formattedID: React.Node = <tt>{event.gameID}</tt>
    return (
        <SingleRecord color="#259950">
            {`Joined `}{formattedID}.
        </SingleRecord>
    );
}

export function PlayerJoinRecord({ event }: { event: Event.PlayerJoin }) {
    return (
        <SingleRecord color={srutil.hashedColor(event.player.id)}>
            {`${event.player.name} joined the game.`}
        </SingleRecord>
    );
}
