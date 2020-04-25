// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import * as Event from 'event';

import DiceList from 'roll/components/dice-list';
import * as srutil from 'srutil';

type RecordProps = {| +style: any |};

type SingleRecordProps = {
    color?: string,
    children: React.Node | React.Node[],
    ...RecordProps
};
const SingleRecord: StyledComponent<SingleRecordProps> = styled(UI.FlexRow)`
    padding: 2px 4px;
    ${props => props?.color ? `
        border-left: 6px solid ${props.color};
        border-top: 3px solid white;
        border-bottom: 3px solid white;

    ` : ''
    }
`;

const DoubleRecord: StyledComponent<SingleRecordProps> = styled(SingleRecord)`
    flex-direction: column;
    align-items: flex-start;
`;

type LocalRollProps = { +event: Event.LocalRoll, ...RecordProps };
export function LocalRollRecord({ event, style }: LocalRollProps) {
    const title = event.title !== '' ?
        <>&nbsp;for <b>{event.title}</b></> : '';
    return (
        <DoubleRecord color="slateGray" style={style}>
            {`Rolled ${event.dice.length} dice`}{title}
            <DiceList dice={event.dice} showNumbers={false} />
        </DoubleRecord>
    );
}

type GameRollProps = { +event: Event.GameRoll, ...RecordProps };
export function GameRollRecord({ event, style }: GameRollProps) {
    const title = event.title !== '' ?
        <>&nbsp;to <b>{event.title}</b></> : '';
    return (
        <DoubleRecord color={srutil.hashedColor(event.playerID)} style={style}>
            <span>
                <UI.PlayerName id={event.playerID} name={event.playerName} />
                {` rolls ${event.dice.length} dice`}{title}
            </span>
            <DiceList dice={event.dice} showNumbers={false} />
        </DoubleRecord>
    );
}

type PlayerJoinProps = { +event: Event.PlayerJoin, ...RecordProps };
export function PlayerJoinRecord({ event, style }: PlayerJoinProps) {
    const name = <UI.PlayerName id={event.player.id} name={event.player.name} />
    return (
        <SingleRecord color={srutil.hashedColor(event.player.id)} style={style}>
            <span>
            {name}{` joined.`}
            </span>
        </SingleRecord>
    );
}
