// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import * as dice from 'dice';

import type { Connection } from 'connection';
import * as Event from 'event';
import * as rollStats from 'rollStats';
import routes from 'routes';
import * as srutil from 'srutil';

export const Title: StyledComponent<> = styled.div`
    line-height: 1.2em;
    padding-left: 2px;
`;

export const Scrollable: StyledComponent<> = styled(UI.FlexColumn)`
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

export const StyledResults: StyledComponent<{ color: string }> = styled.b`
    color: ${props => props.color};

    align-self: flex-start;
    line-height: 1.2;
    margin-top: 0;
    margin-left: auto;
    padding: 0 4px 0 .5em;
    white-space: nowrap;
`;

type RollMessageProps = {
    +color: string,
    +result: rollStats.HitsResults,
};
export function Results({ color, result }: RollMessageProps) {
    const message = rollStats.resultMessage(result);
    return (
        <StyledResults color={color}>
            {message}
        </StyledResults>
    )
}

type RoundsProps = {
    +rounds: number[][],
    +icon: any,
    +color: string,
    +transform?: string,
};
export function Rounds({ rounds, icon, transform, color }: RoundsProps): React.Node {
    if (rounds.length === 0) {
        return (
            <UI.FlexRow>
                <UI.FAIcon icon={icon} color={color} className="sr-die"
                            fixedWidth transform={transform} />
                <tt>:(</tt>
            </UI.FlexRow>
        );
    }
    return (
        <UI.FlexRow>
            {rounds.map((rolls, ix) =>
                <dice.List key={ix} rolls={rolls}>
                    <UI.FAIcon icon={icon} color={color} className="sr-die"
                        style={{marginRight:'.2em'}} size="sm" />
                </dice.List>
            )}
        </UI.FlexRow>
    );
}

function canSecondChance(result: rollStats.HitsResults) {
    return !result.edged && result.hits < result.dice.length;
}

type Props = { event: Event.DiceEvent, result: rollStats.HitsResults };
function LocalActionsRow({ event, result }: Props) {
    const dispatch = React.useContext(Event.DispatchCtx);

    const onSecondChance = React.useCallback(function onSecondChance() {
        if (!event.dice) { return; }
        dispatch({
            ty: "reroll", id: event.id,
            edit: Date.now().valueOf(),
            round: srutil.rerollFailures(event.dice)
        });
    }, [event, dispatch]);

    const onEdit = React.useCallback(function onEdit() {
        dispatch({ ty: "selectEdit", event: event });
    }, [event, dispatch]);

    return (
        <UI.FlexRow spaced>
            {canSecondChance(result) &&
                <UI.LinkButton onClick={onSecondChance}>
                    second chance
                </UI.LinkButton>
            }
            <UI.LinkButton onClick={onEdit}>
                edit
            </UI.LinkButton>
        </UI.FlexRow>
    );
}

function GameActionsRow({ event, result }: Props) {
    const dispatch = React.useContext(Event.DispatchCtx);

    const [connection, setConnection] = React.useState<Connection>("offline");

    const onSecondChance = React.useCallback(function onSecondChance() {
        routes.game.reroll({ rollID: event.id, rerollType: "rerollFailures" })
            .onConnection(setConnection);
    }, [event]);

    const onEdit = React.useCallback(function onEdit() {
        dispatch({ ty: "selectEdit", event: event });
    }, [event, dispatch]);

    return (
        <UI.FlexRow spaced>
            {canSecondChance(result) &&
                <UI.LinkButton disabled={connection === "connecting"}
                               onClick={onSecondChance}>
                    second chance
                </UI.LinkButton>
            }
            <UI.LinkButton onClick={onEdit}>
                edit
            </UI.LinkButton>
        </UI.FlexRow>
    );
}

export function ActionsRow({ event, result }: Props) {
    if (event.source === "local") {
        return (<LocalActionsRow event={event} result={result} />);
    }
    else {
        return (<GameActionsRow event={event} result={result} />);
    }
}
