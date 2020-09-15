// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import * as dice from 'dice';

import * as Game from 'game';
import * as Event from 'event';
import routes from 'routes';
import * as srutil from 'srutil';
import * as rollStats from 'rollStats';

type RollActionsProps = {
    +edgeActions: bool,
    +onPush: () => void,
    +onSecondChance: () => void,
    +onRemove?: () => void,
}
function RollActionsRow({edgeActions, onPush, onSecondChance, onRemove}: RollActionsProps) {
    return (
        <UI.LinkList>
            {/*<UI.LinkButton disabled={!edgeActions} onClick={onPush}>
                push the limit
            </UI.LinkButton>*/}
            <UI.LinkButton disabled={!edgeActions} onClick={onSecondChance}>
                second chance
            </UI.LinkButton>
            {/*<UI.LinkButton disabled={!onRemove} onClick={onRemove}>
                remove
            </UI.LinkButton>*/}
        </UI.LinkList>
    );
}

function rollActions(event: Event.DiceEvent, eventIx: number, dispatch: Event.Dispatch): RollActionsProps {
    if (event.ty === "rerollFailures" || event.rounds) {
        return { edgeActions: false, onPush: () => {}, onSecondChance: () => {} };
    }

    if (event.source === "local") {
        return {
            edgeActions: true,
            onPush: () => {},
            onSecondChance: function() {
                const rerolled: Event.RerollFailures = {
                    ty: "rerollFailures",
                    id: Event.newID(),
                    source: "local",
                    rollID: event.id,
                    title: event.title,
                    rounds: [srutil.rerollFailures(event.dice), event.dice]
                };
                dispatch({ ty: "newEvent", event: rerolled });
            },
        };
    }
    else {
        return {
            edgeActions: true,
            onPush: () => {},
            onSecondChance: function() {
                routes.game.reroll({ rerollType: "rerollFailures", rollID: event.id });
            }
        }
    }
}

const WrapperColumn = styled(UI.FlexColumn)``;

const TitleRow = styled(UI.FlexRow)`
    flex-grow: 1;
`;

const StyledResults = styled.b`
    color: ${props => props.color};

    position: sticky;
    left: 0;

    margin-left: auto;
    padding-left: 1em;
    justify-content: flex-end;
    white-space: nowrap;
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
    overflow-x: auto; /* Left-right scroll */
    flex-wrap: nowrap;
    align-content: stretch;

    & > * {
        flex-basis: max-content;
        margin-bottom: 4px;
    }
    & :last-child {
        margin-bottom: 0;
    }
`;

const EdgeDiceRounds = styled(UI.FlexRow)`
    flex-grow: 1;
    & > * {
        margin-right: 1.5em;
    }
`;

type RollProps = {
    +event: Event.Roll | Event.EdgeRoll | Event.RerollFailures,
    +eventIx: number,
};
export const RollRecord = React.memo<RollProps>(function RollRecord({ event, eventIx }: RollProps) {
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const game = React.useContext(Game.Ctx);

    const color = Event.colorOf(event);
    const result = rollStats.results(event);
    const canModify = Event.canModify(event, game?.player?.id);
    const actions = rollActions(event, eventIx, eventDispatch);

    let eventAction = " rolls ";
    let eventIntro = "Rolled";
    if (result.rerolled) {
        eventAction = (<b>&nbsp;rerolls failures</b>);
        eventIntro = (<b>Rerolled failures</b>);
    }
    else if (result.edged) {
        eventAction = (<b>&nbsp;pushes the limit</b>);
        eventIntro = (<b>Pushed the limit</b>);
    }

    let intro: React.Node = event.source !== "local" ? (
        <span>
            <UI.HashColored id={event.source.id}>
                {event.source.name}
            </UI.HashColored>
            {eventAction}
        </span>
    ) : (
        <span>
            {eventIntro}
        </span>
    );
    const title: React.Node = event.title ? (
        <span>
            to <b>{event.title}</b>
        </span>
    ) : event.dice ? (
        <span>
            <tt>{event.dice.length}</tt> {event.dice.length === 1 ? "die" : "dice"}
        </span>
    ) : (
        <span>
            {result.rerolled ? "with " : "on "}
            <tt>{event.rounds[0].length}</tt> {event.rounds[0].length === 1 ? "die" : "dice"}
            {result.rounds > 1 && (
                <> in <tt>{result.rounds}</tt> rounds </>
            )}
        </span>
    );
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
        <WrapperColumn>
            <RollScrollable>
                <TitleRow>
                    <UI.NoWrap>{intro} {title}</UI.NoWrap>
                    {result.shouldDisplay &&
                        <ResultInfo color={color} result={result} />}
                </TitleRow>
                {diceList}
            </RollScrollable>
            {canModify && !result.edged &&
                <RollActionsRow edgeActions={!result.edged} {...actions} />}
        </WrapperColumn>
    );
});
