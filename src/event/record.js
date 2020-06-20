// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import * as dice from 'dice';

import * as Event from 'event';

import RollResult from 'roll/result';
import * as srutil from 'srutil';

type RecordProps = {| +style: any |};

const GUTTER_SIZE = 4;

type SingleRecordProps = {
    color?: string,
    children: React.Node | React.Node[],
    ...RecordProps
};
const SingleRecord: StyledComponent<SingleRecordProps> = styled(UI.FlexRow).attrs(
    props => ({
        style: {
            ...props.style,
            top: props.style.top + GUTTER_SIZE,
            height: props.style.height - GUTTER_SIZE,
        }
    })
)`
    line-height: 1.5;
    padding: 3px 4px;
    ${props => props?.color ? `
        border-left: 4px solid ${props.color};
    ` : ''
    }
`;

const RollTitleRow = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

const DoubleRecord: StyledComponent<SingleRecordProps> = styled(SingleRecord)`
    flex-direction: column;
    align-items: flex-start;
`;

export function EventsLoadingIndicator({ style }: any) {
    return (
        <SingleRecord color="white" style={style}>
            <span>Getting some rolls... <UI.DiceSpinner /></span>
        </SingleRecord>
    );
}

type LocalRollProps = { +event: Event.LocalRoll, ...RecordProps };
export const LocalRollRecord = React.memo<LocalRollProps>(function LocalRollRecord({ event, style }) {
    const title = event.title !== '' ?
        <>&nbsp;to <b>{event.title}</b></> : '';
    const rollResult = new RollResult(event.dice);
    return (
        <DoubleRecord color="slateGray" style={style}>
            <RollTitleRow>
            <span>
                {`Rolled ${event.dice.length} dice`}{title}
            </span>
            {rollResult.shouldDisplay ?
                <b style={{ 'color': "slateGray" }}>
                    {rollResult.toString()}
                </b> : ''}
            </RollTitleRow>
            <dice.List rolls={event.dice} />
        </DoubleRecord>
    );
});

type GameRollProps = { +event: Event.GameRoll, ...RecordProps };
export const GameRollRecord = React.memo<GameRollProps>(function GameRollRecord({ event, style }) {
    const title = event.title !== '' ?
        <>&nbsp;to <b>{event.title}</b></> : '';
    const rollResult = new RollResult(event.dice);
    return (
        <DoubleRecord color={srutil.hashedColor(event.playerID)} style={style}>
            <RollTitleRow>
            <span>
                <UI.PlayerName id={event.playerID} name={event.playerName} />
                {` rolls ${event.dice.length} dice`}{title}
            </span>
            {rollResult.shouldDisplay ?
                <UI.HashColored id={event.playerID}>
                    {rollResult.toString()}
                </UI.HashColored>
                : ''}
            </RollTitleRow>
            <dice.List rolls={event.dice} />
        </DoubleRecord>
    );
});

type PlayerJoinProps = { +event: Event.PlayerJoin, ...RecordProps };
export const PlayerJoinRecord = React.memo<PlayerJoinProps>(function PlayerJoinRecord({ event, style }) {
    const name = <UI.PlayerName id={event.player.id} name={event.player.name} />
    return (
        <SingleRecord color={srutil.hashedColor(event.player.id)} style={style}>
            <span>
            {name}{` joined.`}
            </span>
        </SingleRecord>
    );
});
