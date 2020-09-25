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
    +event: Event.RerollFailures,
}
function RerollRecord({ event }: Props, ref) {
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
            <b>rerolls failures</b>
        </>
    ) : (
        <b>Rerolled failures</b>
    );

    const title = event.title ? (
        <>to <b>{event.title}</b></>
    ) : (
        <>on {event.rounds[1].length} dice</>
    );

    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow alignItems="flex-start">
                <Roll.Title>{intro} {title}</Roll.Title>
                <Roll.Results color={color} result={result} />
            </UI.FlexRow>
            <Roll.Scrollable>
                <dice.List rolls={event.rounds[1]} />
                <Roll.Rounds icon={icons.faRedo} color={color}
                             transform="grow-5"
                             rounds={[event.rounds[0]]} />
            </Roll.Scrollable>
            <UI.FlexRow>
                <humanTime.Since date={Event.timeOf(event)} />
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}
export const Reroll = React.memo<Props>(React.forwardRef(RerollRecord));
