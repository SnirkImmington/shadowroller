// @flow

import * as React from 'react';
import * as UI from 'style';
import theme from 'style/theme';
import * as icons from 'style/icon';

import * as Game from 'game';
import * as Event from 'history/event';
import * as server from 'server';
import * as Player from 'player';
import * as Stream from 'stream-provider';
import * as srutil from 'srutil';
import { StatusText, ConnectionCtx, SetConnectionCtx } from 'connection';
import type { ResponseStatus } from 'connection';
import routes from 'routes';

import ColorPicker from 'color-picker';
import { EventRecord } from 'history/history-panel';
import { ROLL_TITLE_FLAVOR } from 'roll-dice';

type Props = {
    hide: () => void
}

export default function EditPlayerPanel({ hide }: Props) {
    const game = React.useContext(Game.Ctx);
    const player = React.useContext(Player.Ctx);
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const [connect, logout] = React.useContext(Stream.Ctx);
    const connection = React.useContext(ConnectionCtx);
    const setConnection = React.useContext(SetConnectionCtx);

    const [showGames, toggleShowGames] = srutil.useToggle(false);
    const [switchGame, setSwitchGame] = React.useState("");
    const [switchResponse, setSwitchResponse] = React.useState<ResponseStatus>("ready");
    const handleSwitchGame = React.useCallback((e) => setSwitchGame(e.target.value), [setSwitchGame]);

    const [name, setName] = React.useState(player?.name);
    const [hue, setHue] = React.useState<number>(player?.hue || 0);
    const [onlineMode, setOnlineMode] = React.useState<Player.OnlineMode>(player?.onlineMode || Player.OnlineModeAuto);
    const setOnlineModeAuto = React.useCallback(() => setOnlineMode(Player.OnlineModeAuto), [setOnlineMode]);
    const setOnlineModeOnline = React.useCallback(() => setOnlineMode(Player.OnlineModeOnline), [setOnlineMode]);
    const setOnlineModeOffline = React.useCallback(() => setOnlineMode(Player.OnlineModeOffline), [setOnlineMode]);

    const [response, setResponse] = React.useState<ResponseStatus>("ready");
    const [exampleTitle] = srutil.useFlavor(ROLL_TITLE_FLAVOR);
    const [dice] = React.useState(() => srutil.roll(11));

    if (!player || !game) {
        return null;
    }

    const switchDisabled = !showGames || !switchGame || switchGame === game.gameID || response === "loading";
    const changed = name !== player.name || hue !== player.hue || onlineMode !== player.onlineMode;
    const connected = connection === "connected" && response !== "loading";

    function onSubmit(e) {
        e.preventDefault();
        if (!changed) { return; }
        let diff = {};
        if (name !== player.name) {
            diff.name = name;
        }
        if (hue !== player.hue) {
            diff.hue = hue;
        }
        if (onlineMode !== player.onlineMode) {
            diff.onlineMode = onlineMode;
        }
        setResponse("loading");
        routes.player.update({ diff })
            .onResponseStatus(setResponse)
            .onAnyError(err => {
                console.error("Error sending player update", err);
            })
            .onResponse(resp => {
                playerDispatch({ ty: "update", values: resp });
            });
    }

    function onSwitch(e) {
        e.preventDefault();
        if (switchDisabled) { return; }
        // If we've already saved a session, we persist this one.
        const persist = Boolean(server.session);
        setSwitchResponse("loading");
        routes.auth.login({ username: player.username, gameID: switchGame, persist })
            .onResponseStatus(setSwitchResponse)
            .onResponse(response => {
                server.handleLogin({
                    persist, response,
                    setConnection, connect,
                    gameDispatch, playerDispatch, eventDispatch
                });
                toggleShowGames();
            });
    }

    function onLogout(e) {
        e.preventDefault();
        logout();
        hide();
    }

    let displayName = name || player.name;
    const exampleEvent: Event.Roll = {
        ty: "roll", id: new Date().valueOf(),
        source: { id: player.id, name: displayName },
        title: exampleTitle, dice, glitchy: 0
    }

    const hueColor = Player.colorOf({ ...player, hue });

    return (
        <UI.Card color={theme.colors.primary}>
            <UI.ColumnToRow maxWidth>
                <UI.CardTitleText color={theme.colors.primary}>
                    <UI.FAIcon icon={icons.faUserEdit} />
                    Logged in: {player.name} / {game.gameID}
                </UI.CardTitleText>
                <UI.FlexRow maxWidth spaced>
                    <span style={{ flexGrow: 1 }} />
                    <UI.LinkButton onClick={onLogout}>log out</UI.LinkButton>
                    <UI.LinkButton onClick={toggleShowGames}>switch game</UI.LinkButton>
                    <UI.LinkButton minor onClick={hide}>close</UI.LinkButton>
                </UI.FlexRow>
            </UI.ColumnToRow>
            <form id="player-settings" onSubmit={onSubmit}>
                <UI.FlexColumn>
                    {showGames && <UI.ColumnToRow maxWidth justifyContent="space-around">
                        <UI.FlexRow formRow justifyContent="space-around">
                            Join
                            <UI.Input value={switchGame} placeholder={game.gameID}
                                      onChange={handleSwitchGame}
                                      disabled={!connected} />
                            <UI.LinkButton disabled={switchDisabled} onClick={onSwitch}>
                                switch
                            </UI.LinkButton>
                        </UI.FlexRow>
                        {switchResponse !== "ready" && switchResponse !== "success" &&
                            <UI.FlexRow maxWidth floatRight>
                                {switchResponse}
                            </UI.FlexRow>
                        }
                    </UI.ColumnToRow>}
                    <UI.FlexRow formRow justifyContent="space-around">
                        <EventRecord editing style={{}} noActions
                            playerID={player.id} color={hueColor} event={exampleEvent} />
                    </UI.FlexRow>
                    <UI.ColumnToRow>
                        <UI.FlexRow formRow>
                            Name
                            <UI.Input value={name} placeholder={player.name}
                                      onChange={e => setName(e.target.value)}
                                      disabled={!connected} />
                        </UI.FlexRow>
                        <UI.FlexRow formRow flexGrow>
                            <label htmlFor="player-settings-hue">Hue</label>
                            &nbsp;
                            <ColorPicker id="player-settings-hue" style={{flexGrow: 1}}
                                         value={hue} onSelect={setHue}
                                         disabled={!connected} />
                        </UI.FlexRow>
                    </UI.ColumnToRow>
                    <UI.FlexRow justifyContent="space-around">
                        Online indicator
                        <UI.FlexColumn>
                        <UI.RadioLink id="player-settings-online-auto"
                                      name="player-settings-online-mode" type="radio" light
                                      checked={onlineMode === Player.OnlineModeAuto}
                                      onChange={setOnlineModeAuto}>
                                When connected
                        </UI.RadioLink>
                        <UI.RadioLink id="player-settings-online-always-online"
                                      name="player-settings-online-mode" type="radio" light
                                      checked={onlineMode === Player.OnlineModeOnline}
                                      onChange={setOnlineModeOnline}>
                                Always online
                        </UI.RadioLink>
                        <UI.RadioLink id="player-settings-online-always-offline"
                                      name="player-settings-online-mode" type="radio" light
                                      checked={onlineMode === Player.OnlineModeOffline}
                                      onChange={setOnlineModeOffline}>
                                Always offline
                        </UI.RadioLink>
                        </UI.FlexColumn>
                    </UI.FlexRow>
                    <UI.FlexRow spaced>
                        <StatusText connection={connection}/>
                        <span style={{flexGrow: 1}} />
                        <UI.LinkButton disabled={!changed || !connected}>update</UI.LinkButton>
                        <UI.LinkButton minor onClick={hide}>close</UI.LinkButton>
                    </UI.FlexRow>
                </UI.FlexColumn>
            </form>
        </UI.Card>
    )
}
