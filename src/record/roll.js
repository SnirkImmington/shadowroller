// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import * as dice from 'dice';

import * as Event from 'event';

import * as srutil from 'srutil';
import * as rollStats from 'rollStats';

/*
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
}*/

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

const EdgeDiceRounds = styled(UI.FlexRow)`
    & > * {
        margin-right: 2rem;
    }
`;

type RollProps = {
    +event: Event.Roll | Event.EdgeRoll,
    +eventIx: number,
    //...RollActionsProps,
};
export const RollRecord = React.memo<RollProps>(function RollRecord({ event, ...actions }: RollProps) {
    console.log("Rendering", arguments[0], event.id);
    const color = event.source !== "local" ? srutil.hashedColor(event.id) : 'slategray';
    const result = rollStats.results(event);

    let intro: React.Node = event.source !== "local" ? (
        <span>
            <UI.HashColored id={event.source.id}>
                {event.source.name}
            </UI.HashColored>
            {event.rounds ? (<b>pushes the limit&nbsp;</b>) : " rolls "}
        </span>
    ) : (
        <span>
            {event.rounds ? "Pushed the limit" : "Rolled"}
        </span>
    );
    const title: React.Node = event.title ? (
        <>
            to
            <b>{event.title}</b>
        </>
    ) : (event.dice ? (
        <>
            <tt>{event.dice.length}</tt> dice
        </>
    ) : (
        <>
            on <tt>{result.dice.length}</tt> dice
            {result.rounds > 1 && (
                <>
                    in <tt>{result.rounds}</tt> rounds
                </>
            )}
        </>
    ));
    const diceList: React.Node = event.dice ? (
        <dice.List rolls={event.dice} />
    ) : (
        <EdgeDiceRounds>
            {event.rounds.map((rolls, ix) =>
                <dice.List key={ix} rolls={rolls} />
            )}
        </EdgeDiceRounds>
    );

    return (
        <UI.FlexColumn>
            <RollScrollable>
                <span>{intro} {title}</span>
                {result.shouldDisplay &&
                    <ResultInfo color={color} result={result} />}
                {diceList}
            </RollScrollable>
        </UI.FlexColumn>
    );
});
