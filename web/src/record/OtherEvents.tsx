import * as React from 'react';
import * as UI from 'style';
import * as humanTime from 'component/HumanTime';
import * as Game from 'game';
import * as Event from 'event';

type PlayerJoinProps = {
    event: Event.PlayerJoin,
    playerID: string|null,
    hue: number|null|undefined,
};
export const PlayerJoin = React.memo(React.forwardRef<HTMLDivElement, PlayerJoinProps>(function PlayerJoin({ event, hue }: PlayerJoinProps, ref) {
    const game = React.useContext(Game.Ctx);

    const name = <UI.PlayerColored hue={hue}>{event.source.name}</UI.PlayerColored>;
    return (
        <UI.FlexColumn ref={ref}>
            <UI.FlexRow>
                <span style={{ lineHeight: '1.2' }}>
                    {name}{' joined '}
                    {game?.gameID != null ?
                        <tt>{game.gameID}</tt> : "the game"}.
                </span>
            </UI.FlexRow>
            <UI.FlexRow>
                <humanTime.Since date={Event.timeOf(event)} />
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}), (prev, next) => prev.event.id === next.event.id);

export const Loading = React.memo(React.forwardRef<HTMLElement, {}>(function LoadingIndicator(_props, ref) {
    return (
        <span ref={ref}>Getting some rolls... <UI.DiceSpinner /></span>
    );
}));
