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
export function LocalRollRecord({ event, style }: LocalRollProps) {
    const title = event.title !== '' ?
        <>&nbsp;to <b>{event.title}</b></> : '';
    const rollResult = new RollResult(event.dice);
    const diceList = React.useMemo(() => (
        <dice.List rolls={event.dice} />
    ), [event.dice]);
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
            {diceList}
        </DoubleRecord>
    );
}

type GameRollProps = { +event: Event.GameRoll, ...RecordProps };
export function GameRollRecord({ event, style }: GameRollProps) {
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
}

export function EditRollRecord({ event, style }: GameRollProps) {
    const title = event.title !== '' ?
        <>
            to <b>{event.title}</b>
        </>
        : `${event.dice.length} dice`;
    const rollResult = new RollResult(event.dice);
    return (
        <DoubleRecord color={srutil.hashedColor(event.playerID)} style={style}>
            <div style={{width: '100%'}}>
            <RollTitleRow maxWidth>
                <span>
                    <UI.PlayerName id={event.playerID} name={event.playerName} />
                    &nbsp;rolls&nbsp;
                    {title}
                </span>
            {rollResult.shouldDisplay ?
                <UI.HashColored id={event.playerID}>
                    {rollResult.toString()}
                </UI.HashColored>
                : ''}
            </RollTitleRow>
            <dice.List rolls={event.dice} />
            </div>
            <UI.FlexRow maxWidth>
                <UI.LinkButton light>push the limit</UI.LinkButton>
                &nbsp;|&nbsp;
                <UI.LinkButton light>second chance</UI.LinkButton>
                &nbsp;|&nbsp;
                <UI.LinkButton light disabled>remove</UI.LinkButton>
            </UI.FlexRow>
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
