// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';
import * as dice from 'dice';
import * as humanTime from 'humanTime';
import * as icons from 'style/icon';
import * as Roll from './rollComponents';

import * as Event from 'event';
import * as Game from 'game';
import * as rollStats from 'rollStats';

type Props = {
    +event: Event.EdgeRoll,
}
function EdgeRollRecord({ event }: Props, ref) {
    const game = React.useContext(Game.Ctx);

    const color = Event.colorOf(event);
    const result = rollStats.results(event);
    const canModify = Event.canModify(event, game?.player?.id);

    const intro: React.Node = event.source !== "local" ? (
        <>
            <UI.HashColored id={event.source.id}>
                {event.source.name}
            </UI.HashColored>
            &nbsp;
            <b>pushes the limit</b>
        </>
    ) : (
        <b>Pushed the limit</b>
    );

    const title = event.title ? (
        <>to <b>{event.title}</b></>
    ) : (
        <>on {event.rounds[0].length} {event.rounds[0].length == 1 ? "die" : "dice"}</>
    );

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <Roll.Title>{intro} {title}</Roll.Title>
                <Roll.Results color={color} result={result} />
            </UI.FlexRow>
            <Roll.Scrollable>
                <dice.List rolls={event.rounds[0]} />
                <UI.FlexRow>
                    <Roll.Rounds icon={icons.faBolt} color={color}
                                 rounds={event.rounds.slice(1)} />
                </UI.FlexRow>
            </Roll.Scrollable>
            <UI.FlexRow>
                <humanTime.Since date={Event.timeOf(event)} />
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}
export const EdgeRoll = React.memo<Props>(React.forwardRef(EdgeRollRecord));
