// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';

import * as Game from 'game';
import * as Event from 'event';
import * as server from 'server';
import * as Stream from '../stream';
import * as srutil from 'srutil';
import { SetConnectionCtx } from 'connection';

import ColorPicker from 'color-picker';
import { EventRecord } from 'history-panel';
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
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const stream = React.useContext(Stream.Ctx);
    const setStream = React.useContext(Stream.SetterCtx);
    const setConnection = React.useContext(SetConnectionCtx);

    const [name, setName] = React.useState(game?.player?.name);
    const [hue, setHue] = React.useState(0);
    const [loading, setLoading] = React.useState(false);

    const [exampleTitle, updateTitleFlavor] = srutil.useFlavor(ROLL_TITLE_FLAVOR);
    const [dice] = React.useState(() => srutil.roll(11));
    const [initiativeDice] = React.useState(() => srutil.roll(2));

    if (!game) {
        return null;
    }

    const changed = name !== game.player.name || hue != 0;

    let displayName = name || game.player.name;


    let title = `Connected to ${game.gameID} as ${game.player.name}`

    function onSubmit(e) {
        e.preventDefault();
        if (!changed) { return; }
        hide();
    }

    function onLogout(e) {
        e.preventDefault();
        server.handleLogout(stream, setStream, setConnection, gameDispatch, eventDispatch);
    }

    const exampleInitiative: Event.Initiative = {
        ty: "initiativeRoll", id: new Date().valueOf(),
        source: { id: game.player.id, name: displayName },
        title: "", base: 13, dice: initiativeDice
    }

    const exampleEvent: Event.Roll = {
        ty: "roll", id: new Date().valueOf(),
        source: { id: game.player.id, name: displayName },
        title: exampleTitle, dice, glitchy: 0
    }

    const hueColor = `hsl(${hue}, 80%, 56%)`;


    return (
        <UI.Card color={theme.colors.primary}>
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>
                    Options for {game.player.name}
                </UI.CardTitleText>
                <UI.FlexRow spaced>
                    <UI.LinkButton>log out</UI.LinkButton>
                    <span />
                    <UI.LinkButton minor onClick={hide}>close</UI.LinkButton>
                </UI.FlexRow>
            </UI.FlexRow>
            <form id="player-settings" onSubmit={onSubmit}>
                <UI.FlexColumn>
                    <UI.FlexRow formRow justifyContent="space-around">
                        <EventRecord style={{}} noActions setHeight={() => {}}
                            playerID={game.player.id} color={hueColor} event={exampleEvent} />
                    </UI.FlexRow>
                    <UI.ColumnToRow>
                        <span style={{ flexGrow: 1}} />
                        <UI.FlexRow formRow>
                            Player name
                            <UI.Input value={name} onChange={e => setName(e.target.value)} />
                        </UI.FlexRow>
                        <UI.FlexRow formRow>
                            <label htmlFor="player-settings-hue">Hue</label>
                            &nbsp;
                            <ColorPicker id="player-settings-hue" style={{flexGrow: 1}} value={hue} onSelect={setHue} />
                        </UI.FlexRow>
                        <span style={{ flexGrow: 1 }} />
                    </UI.ColumnToRow>
                    <UI.FlexRow spaced>
                        <span style={{flexGrow: 1}} />
                        <UI.LinkButton disabled={!changed}>update</UI.LinkButton>
                        <UI.LinkButton minor onClick={hide}>cancel</UI.LinkButton>
                    </UI.FlexRow>
                </UI.FlexColumn>
            </form>
        </UI.Card>
    )
}
