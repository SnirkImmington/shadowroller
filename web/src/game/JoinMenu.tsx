import * as React from 'react';
import styled, { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as Button from 'component/Button';
import * as Text from 'component/Text';
import * as icons from 'style/icon';

import * as Game from 'game';
import * as Event from 'event';
import * as Player from 'player';
import * as Stream from 'sseStream';
import { SetConnectionCtx } from 'connection';
import type { Connection } from 'connection';

import * as server from 'server';
import * as srutil from 'srutil';
import * as routes from 'routes';

/** Flavor for the login menu */
const ENTER_GAME_ID_FLAVOR: React.ReactNode[] = [
    <span><tt>foofaraw</tt> isn't a Game ID.</span>,

    "Pull out your best SIN.",
    "Gimme a real one this time.",
    "I hope you've got a good fake.",
    "I dare you to use your real SIN.",
    "Corporate SINs not accepted.",
    "We probably won't burn your SIN.",
];

/** Description of the "remember me" button */
const REMEMBER_FLAVOR = [
    "Remember me",
    "Save my mark",
];

/** Flavor while login request is loading */
const LOADING_FLAVOR = [
    "Hacking you in...",
    "Acquiring marks...",
    "Accessing game node...",
    "Asking for permission...",
];
/** Flavor for 400 errors */
const CLIENT_ERROR_FLAVOR = [
    "I don't think that Game ID exists.",
    "You put in the right Game ID?",
    "Game ID first, then player name.",
    "That's not a game ID, chummer.",
    "That's no Game ID.",
    "Access denied! SIN burned!",
];
/** Flavor for 500 errors */
const SERVER_ERROR_FLAVOR = [
    "Something went wrong with the server.",
    "The server is having an issue.",
    "The server is having issues, okay?",
    "Server glitched attempting to check your ID.",
];
/** Flavor for request failing before an error */
const NO_CONNECTION_FLAVOR = [
    "Can't connect to the server.",
    "Too much Noise to connect.",
];

type Props = {
    hide: () => void
};

const CheckmarkOffset = styled.span`
    @media all and (min-width: 768px) {
        width: 1.5rem;
    }
`;

export default function JoinMenu({ hide }: Props) {
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const [connect] = React.useContext(Stream.Ctx);
    const playerDispatch = React.useContext(Player.DispatchCtx);
    const theme = React.useContext(ThemeContext);

    const [gameID, setGameID] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [persist, setPersist] = React.useState(false);
    const [loginConnection, setLoginConnection] = React.useState<Connection>("offline");

    const [persistFlavor] = srutil.useFlavor(REMEMBER_FLAVOR);
    const [enterIDFlavor] = srutil.useFlavor(ENTER_GAME_ID_FLAVOR);
    const [connectingFlavor, newConnecting] = srutil.useFlavor(LOADING_FLAVOR);
    const [networkErrorFlavor, newNetworkErrorFlavor] = srutil.useFlavor(NO_CONNECTION_FLAVOR);
    const [clientErrorFlavor, newClientErrorFlavor] = srutil.useFlavor(CLIENT_ERROR_FLAVOR);
    const [serverErrorFlavor, newServerErrorFlavor] = srutil.useFlavor(SERVER_ERROR_FLAVOR);

    const [flavor, setFlavor] = React.useState<React.ReactNode>(enterIDFlavor);

    const ready = gameID !== '' && username !== '';

    function onGameIDChange(event: React.ChangeEvent<HTMLInputElement>) {
        setGameID(event.target.value ?? '');
    }
    function onUsernameChange(event: React.ChangeEvent<HTMLInputElement>) {
        setUsername(event.target.value ?? '');
    }

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!ready) { return; }

        setFlavor(connectingFlavor);
        newConnecting();

        routes.auth.login({ gameID, username, persist })
            .onConnection(setLoginConnection)
            .onResponse(response  => {
                hide();
                server.handleLogin({
                    persist, response, connect,
                    setConnection, gameDispatch, playerDispatch, eventDispatch
                });
            })
            .onClientError(_ => {
                setFlavor(clientErrorFlavor);
                newClientErrorFlavor()
            })
            .onServerError(_ => {
                setFlavor(serverErrorFlavor);
                newServerErrorFlavor();
            })
            .onNetworkError(_ => {
                setFlavor(networkErrorFlavor);
                newNetworkErrorFlavor();
            });
    }

    let warn = loginConnection === "disconnected" || loginConnection === "errored";

    return (
        <UI.Card color={theme.colors.primary}>
            <UI.FlexRow maxWidth justifyContent="space-between">
                <UI.CardTitleText color={theme.colors.primary}>
                    <UI.FAIcon icon={icons.faUsers} />
                    Join a game
                </UI.CardTitleText>
                <Button.Minor onClick={hide}>
                    hide
                </Button.Minor>
            </UI.FlexRow>
            <form id="join-game" onSubmit={onSubmit}>
                <UI.FlexColumn>
                    <UI.FlexRow formRow flexWrap>
                        <i>Join a game if you've been given a Game ID.&nbsp;</i>
                        <Text.Flavor warn={warn}>{flavor}</Text.Flavor>
                    </UI.FlexRow>
                    <UI.FlexRow flexWrap maxWidth spaced>
                        <UI.FlexRow formRow>
                            <UI.FAIcon icon={icons.faKey}
                                       color={theme.colors.secondary}
                                       fixedWidth transform="grow-5" />
                            <UI.Input monospace id="join-game-id"
                                      placeholder="Game ID"
                                      autoComplete="on" autoCapitalize="none"
                                      spellCheck="false"
                                      value={gameID} onChange={onGameIDChange}
                                      disabled={loginConnection === "connecting"} />
                        </UI.FlexRow>
                        <UI.FlexRow formRow>
                            <UI.FAIcon icon={icons.faIdCard}
                                       color={theme.colors.secondary}
                                       fixedWidth transform="grow-5" />
                            <UI.Input id="join-username"
                                      placeholder="Username"
                                      autoComplete="on" autoCapitalize="none"
                                      spellCheck="false"
                                      value={username} onChange={onUsernameChange}
                                      disabled={loginConnection === "connecting"} />
                        </UI.FlexRow>
                    </UI.FlexRow>
                    <UI.FlexRow formRow floatRight>
                        <CheckmarkOffset />
                        <UI.RadioLink type="checkbox" id="join-game-persist" light
                                      name="Remember this Game ID"
                                      checked={persist} onChange={(e: { target: { checked: boolean } }) => setPersist(e.target.checked)}
                                      disabled={loginConnection === "connecting"}>
                            {persistFlavor}
                        </UI.RadioLink>
                        <UI.FlexRow formRow spaced>
                            <Button.Main type="submit" disabled={!ready}>
                                join game
                            </Button.Main>
                            <Button.Minor onClick={hide}>
                                cancel
                            </Button.Minor>
                        </UI.FlexRow>
                    </UI.FlexRow>
                </UI.FlexColumn>
            </form>
        </UI.Card>
    );
}
