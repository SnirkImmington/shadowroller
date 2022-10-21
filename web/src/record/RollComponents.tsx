import * as React from 'react';
import styled, { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as Button from 'component/Button';
import * as dice from 'component/Dice';
import * as icons from 'style/icon';

import type { Connection } from 'connection';
import * as Event from 'event';
import * as Share from 'share';
import * as roll from 'roll';
import * as rollStats from 'roll/stats';
import * as routes from 'routes';
import * as colors from 'colorUtil';

export const SignDisplayFormat = new Intl.NumberFormat(undefined, { signDisplay: "always" });

export const Title = styled.div`
    line-height: 1.2em;
    padding-left: 2px;
`;

export const Scrollable = styled(UI.FlexColumn).attrs(
    _props => ({ className: "scrollable" })
)`
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

export const StyledResults = styled.b<{ hue: number|null|undefined }>`
    color: ${({hue, theme}) => colors.playerColor(hue, theme)};

    line-height: 1.2;
    margin-top: 0;
    margin-left: auto;
    padding: 0 4px 0 .5em;
    white-space: nowrap;
`;

type RollMessageProps = {
    hue: number|null|undefined,
    result: rollStats.HitsResults,
};
export function Results({ hue, result }: RollMessageProps) {
    const message = rollStats.resultMessage(result);
    return (
        <StyledResults hue={hue}>
            {message}
        </StyledResults>
    )
}

type RoundsProps = {
    rounds: number[][],
    icon: any,
    hue: number|null|undefined,
    transform?: string,
};
export function Rounds({ rounds, icon, transform, hue }: RoundsProps) {
    const theme = React.useContext(ThemeContext);
    const color = colors.playerColor(hue, theme);
    if (rounds.length === 0) {
        return (
            <UI.FlexRow>
                <UI.FAIcon icon={icon} color={color} className="sr-die"
                            fixedWidth transform={transform} />
                <tt>:{`(`}</tt>
            </UI.FlexRow>
        );
    }
    return (
        <UI.FlexRow>
            {rounds.map((rolls, ix) =>
                <dice.List key={ix} rolls={rolls}>
                    <UI.FAIcon icon={icon} color={color} className="sr-die"
                               style={{ margin: '2px calc(.1em + 1px)' }} size="sm" />
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

    function onSecondChance() {
        if (!("dice" in event)) { return; }
        dispatch({
            ty: "reroll", id: event.id,
            edit: Date.now().valueOf(),
            reroll: roll.secondChance(event.dice)
        });
    };

    function onEdit() {
        dispatch({ ty: "selectEdit", event: event });
    }

    return (
        <UI.FlexRow spaced>
            {canSecondChance(result) &&
                <Button.Minor onClick={onSecondChance}>
                    <Button.Icon icon={icons.faRedo} />
                    second chance
                </Button.Minor>
            }
            <Button.Minor onClick={onEdit}>
                edit
            </Button.Minor>
        </UI.FlexRow>
    );
}

function GameActionsRow({ event, result }: Props) {
    const dispatch = React.useContext(Event.DispatchCtx);

    const [connection, setConnection] = React.useState<Connection>("offline");

    function onSecondChance() {
        routes.game.reroll({ rollID: event.id, rerollType: "rerollFailures" })
            .onConnection(setConnection);
    }

    function onEdit() {
        dispatch({ ty: "selectEdit", event });
    }

    function onReveal() {
        routes.game.editShare({ id: event.id, share: Share.Mode.InGame })
            .onConnection(setConnection);
    }

    return (
        <UI.FlexRow spaced>
            {event.source !== "local" && event.source.share === Share.Mode.GMs &&
                <Button.Minor disabled={connection === "connecting"}
                               onClick={onReveal}>
                    <Button.Icon className="icon-inline" icon={icons.faUsers} transform="grow-6" />
                    {'reveal'}
                </Button.Minor>
            }
            {canSecondChance(result) &&
                <Button.Minor disabled={connection === "connecting"}
                               onClick={onSecondChance}>
                    <Button.Icon icon={icons.faRedo} />
                    second chance
                </Button.Minor>
            }
            <Button.Minor onClick={onEdit}>
                edit
            </Button.Minor>
        </UI.FlexRow>
    );
};

export function ActionsRow({ event, result }: Props) {
    if (event.source === "local") {
        return (<LocalActionsRow event={event} result={result} />);
    }
    else {
        return (<GameActionsRow event={event} result={result} />);
    }
}
