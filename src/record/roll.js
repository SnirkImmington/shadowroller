// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import * as dice from 'dice';

import * as Event from 'event';

import * as srutil from 'srutil';
import * as rollStats from 'rollStats';


type RollActionsProps = {|
    +onPush: () => void,
    +onSecondChance: () => void,
    +onRemove?: () => void,
|}
function RollActionsRow({onPush, onSecondChance, onRemove}: RollActionsProps) {
    return (
        <UI.LinkList>
            <UI.LinkButton onClick={onPush}>
                push the limit
            </UI.LinkButton>
            <UI.LinkButton onClick={onSecondChance}>
                second chance
            </UI.LinkButton>
            <UI.LinkButton disabled={!onRemove} onClick={onRemove}>
                remove
            </UI.LinkButton>
        </UI.LinkList>
    );
}

function localRollActions(event: Event.LocalRoll, eventIx: number, dispatch: Event.Dispatch): RollActionsProps {
    return {
        onPush: function() {
            dispatch({
                ty: "edgePush", ix: eventIx,
            });
        },
        onSecondChance: function() {
            dispatch({
                ty: "edgeReroll", ix: eventIx,
            });
        },
        onRemove: function() {
            dispatch({
                ty: "removeLocal", ix: eventIx,
            });
        }
    };
}

function gameRollActions(event: Event.GameRoll, eventIx: number, dispatch: Event.Dispatch): RollActionsProps {
    return {
        onPush: function() {
            dispatch({
                ty: "edgePush", ix: eventIx,
            });
        },
        onSecondChance: function() {
            dispatch({
                ty: "edgeReroll", ix: eventIx,
            });
        },
    };
}

const StyledResults = styled.b`
    position: sticky;
    top: 0;
    left: 0;
    color: ${props => props.color};
`;

type RollMessageProps = {
    +color: string,
    +result: rollStats.HitsResults,
};
function ResultInfo({ color, result }: RollMessageProps) {
    const message = rollStats.resultMessage(result);
    return (
        <StyledResults color={color}>
            {message}
        </StyledResults>
    )
}

const RollScrollable = styled(UI.FlexColumn)`
    width: 100%;
    overflow-x: auto; /* Left-right scroll */

    & > * {
        margin-bottom: 4px;
    }
    & :last-child {
        margin-bottom: 0;
    }
`;

type RollProps = {
    +event: Event.EventRoll,
    +eventIx: number,
    ...RollActionsProps,
};
export const RollRecord = React.memo<RollProps>(function RollRecord({ event, ...actions }: RollProps) {
    console.log("Rendering", arguments[0], event.id, event.ts);
    const color = event.id ? srutil.hashedColor(event.id) : 'slategray';
    let intro: React.Node = event.id ? (
        <span>
            <UI.HashColored id={event.playerID}>
                {event.playerName}
            </UI.HashColored>
            rolls
        </span>
    ) : (
        <span>
            Rolled
        </span>
    );
    const title: React.Node = event.title ? (
        <>
            to
            <b>{event.title}</b>
        </>
    ) : (
        <>
            <tt>{event.dice.length}</tt> dice
        </>
    );

    const result = rollStats.results(event);

    return (
        <UI.FlexColumn>
            <RollScrollable>
                <span>{intro} {title}</span>
                {result.shouldDisplay &&
                    <ResultInfo color={color} result={result} />}
                <dice.List rolls={event.dice} />
            </RollScrollable>
            <RollActionsRow onPush={actions.onPush}
                            onSecondChance={actions.onSecondChance}
                            onRemove={actions.onRemove} />
        </UI.FlexColumn>
    );
}, (prev, next) =>
    prev.event.id === next.event.id
        && prev.event.ts === next.event.ts
        && prev.style === next.style);
