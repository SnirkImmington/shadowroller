// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';

import * as Game from 'game';
import * as Event from 'history/event';
import * as server from 'server';
import * as Player from 'player';
import * as Stream from 'stream-provider';
import * as srutil from 'srutil';
import { StatusText, ConnectionCtx, SetConnectionCtx } from 'connection';

import ColorPicker from 'color-picker';
import { EventRecord } from 'history/history-panel';
import { ROLL_TITLE_FLAVOR } from 'roll-dice';


const TitleRow = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

type Props = {
    hide: () => void
}

export default function EditPlayerPanel({ hide }: Props) {
    const game = React.useContext(Game.Ctx);
    const player = React.useContext(Player.Ctx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const [_, logout] = React.useContext(Stream.Ctx);
    const connection = React.useContext(ConnectionCtx);
    const setConnection = React.useContext(SetConnectionCtx);

    const [name, setName] = React.useState(player?.name);
    const [hue, setHue] = React.useState(player?.hue || 0);
    const [loading, setLoading] = React.useState(false);

    const [exampleTitle, updateTitleFlavor] = srutil.useFlavor(ROLL_TITLE_FLAVOR);
    const [dice] = React.useState(() => srutil.roll(11));

    if (!player || !game) {
        return null;
    }

    const changed = name !== player.name || hue != 0;
    const connected = connection === "connected";

    function onSubmit(e) {
        e.preventDefault();
        if (!changed) { return; }
        hide();
    }

    function onLogout(e) {
        e.preventDefault();
        logout();
    }

    let displayName = name || player.name;
    const exampleEvent: Event.Roll = {
        ty: "roll", id: new Date().valueOf(),
        source: { id: player.id, name: displayName },
        title: exampleTitle, dice, glitchy: 0
    }

    const hueColor = `hsl(${hue}, 80%, 56%)`;

    return (
        <UI.Card color={theme.colors.primary}>
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>
                    Options for {player.name}
                </UI.CardTitleText>
                <UI.FlexRow spaced>
                    <UI.LinkButton onClick={onLogout}>log out</UI.LinkButton>
                    <span />
                    <UI.LinkButton minor onClick={hide}>close</UI.LinkButton>
                </UI.FlexRow>
            </UI.FlexRow>
            <form id="player-settings" onSubmit={onSubmit}>
                <UI.FlexColumn>
                    <UI.FlexRow formRow justifyContent="space-around">
                        <EventRecord style={{}} noActions setHeight={() => {}}
                            playerID={player.id} color={hueColor} event={exampleEvent} />
                    </UI.FlexRow>
                    <UI.ColumnToRow>
                        <span style={{ flexGrow: 1}} />
                        <UI.FlexRow formRow>
                            Player name
                            <UI.Input value={name} placeholder={player.name}
                                      onChange={e => setName(e.target.value)} />
                        </UI.FlexRow>
                        <UI.FlexRow formRow>
                            <label htmlFor="player-settings-hue">Hue</label>
                            &nbsp;
                            <ColorPicker id="player-settings-hue" style={{flexGrow: 1}} value={hue} onSelect={setHue} />
                        </UI.FlexRow>
                        <span style={{ flexGrow: 1 }} />
                    </UI.ColumnToRow>
                    <UI.FlexRow spaced>
                        <StatusText connection={connection}/>
                        <span style={{flexGrow: 1}} />
                        <UI.LinkButton disabled={!changed || !connected}>update</UI.LinkButton>
                        <UI.LinkButton minor onClick={hide}>cancel</UI.LinkButton>
                    </UI.FlexRow>
                </UI.FlexColumn>
            </form>
        </UI.Card>
    )
}
