// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';
import * as icons from 'style/icon';

import * as Game from 'game';
import * as Event from 'history/event';
import * as Stream from '../stream';
import { ConnectionCtx, SetConnectionCtx } from 'connection';

import * as server from 'server';
import * as srutil from 'srutil';
import routes from 'routes';

const ENTER_GAME_ID_FLAVOR = [
    <span><tt>foofaraw</tt> isn't a Game ID.</span>,

    "Pull out your best SIN.",
    "Gimme a real one this time.",
    "I hope you've got a good fake.",
    "I dare you to use your real SIN.",
    "Corporate SINs not accepted.",
    "We probably won't burn your SIN.",
];

const REMEMBER_FLAVOR = [
    "Remember me",
    "Remember me",
    "Remember me",
    "Save my mark",
];

const LOADING_FLAVOR = [
    "Hacking you in...",
    "Acquiring marks...",
    "Accessing game node...",
    "Asking for permission...",
];
const CLIENT_ERROR_FLAVOR = [
    "I don't think that Game ID exists.",
    "You put in the right Game ID?",
    "Game ID first, then player name.",
    "That's not a game ID, chummer.",
    "That's no Game ID.",
    "Access denied! SIN burned!",
];
const SERVER_ERROR_FLAVOR = [
    "Something went wrong with the server.",
    "The server is having an issue.",
    "The server is having issues, okay?",
    "Server glitched attempting to check your ID.",
];
const NO_CONNECTION_FLAVOR = [
    "Can't connect to the server.",
    "Too much Noise to connect.",
];

const MenuLayout = styled(UI.ColumnToRow)`
    @media all and (min-width: 768px) {
        padding: 0 0.5em;
        align-items: center;
    }

    & > *:first-child {
        @media all and (min-width: 768px) {
            flex-grow: 1;
            justify-content: flex-start;
        }
    }
`;

const InputRow = styled(UI.FlexRow)`
    white-space: pre;
    margin-top: 0.75em;
    justify-content: center;
    @media all and (min-width: 768px) {
        margin-top: 0;
        justify-content: flex-start;
        margin-right: 0.25em;
    }
`;

const ButtonZone = styled(UI.FlexRow)`
    /* Mobile: last row, button on right */
    justify-content: space-between;
    margin: 0.75em 7% 0 11%;

    @media all and (min-width: 768px) {
        margin: 0;
        & > *:last-child {
            margin-left: 1.25em;
            margin-right: 0.5em;
        }
    }

    /* Laptop: spacing between remember and button... */
    & > *:last-child @media all and (min-width: 768px) {
    }
`;

const JoinText = styled.span`
    margin-right: auto;

    margin-bottom: 0.5rem;
    @media all and (min-width: 768px) {
        margin-bottom: 0;
        margin-left: 0.25em;
        margin-right: .5em;
    }
`;

const MenuInput = styled(UI.Input)`
    width: 80%;
    max-width: 80%;
    @media all and (min-width: 768px) {
        width: 200px;
        max-width: 200px;
    }
`;

type Props = {
    +hide: () => void,
};
export function JoinMenu({ hide }: Props) {
    const dispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const connection = React.useContext(ConnectionCtx);
    const setConnection = React.useContext(SetConnectionCtx);
    const setStream = React.useContext(Stream.SetterCtx);

    const [gameID, setGameID] = React.useState('');
    const [playerName, setPlayerName] = React.useState('');
    const [persist, setPersist] = React.useState(false);

    const [persistFlavor] = srutil.useFlavor(REMEMBER_FLAVOR);
    const [enterIDFlavor] = srutil.useFlavor(ENTER_GAME_ID_FLAVOR);
    const [connectingFlavor, newConnecting] = srutil.useFlavor(LOADING_FLAVOR);
    const [networkErrorFlavor, newNetworkErrorFlavor] = srutil.useFlavor(NO_CONNECTION_FLAVOR);
    const [clientErrorFlavor, newClientErrorFlavor] = srutil.useFlavor(CLIENT_ERROR_FLAVOR);
    const [serverErrorFlavor, newServerErrorFlavor] = srutil.useFlavor(SERVER_ERROR_FLAVOR);

    const [flavor, setFlavor] = React.useState<React.Node>(enterIDFlavor);

    const ready = gameID !== '' && playerName !== '';

    function onGameIDChange(event: SyntheticInputEvent<HTMLInputElement>) {
        setGameID(event.target.value ?? '');
    }
    function onPlayerNameChange(event: SyntheticInputEvent<HTMLInputElement>) {
        setPlayerName(event.target.value ?? '');
    }

    function onSubmit(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        if (!ready) { return; }

        setFlavor(connectingFlavor);
        newConnecting();

        routes.auth.login({ gameID, playerName, persist })
            .onConnection(setConnection)
            .onResponse(resp => {
                server.handleLogin(persist, resp, setConnection, setStream, dispatch, eventDispatch);
                hide();
            })
            .onClientError(resp => {
                setFlavor(clientErrorFlavor);
                newClientErrorFlavor()
            })
            .onServerError(resp => {
                setFlavor(serverErrorFlavor);
                newServerErrorFlavor();
            })
            .onNetworkError(resp => {
                setFlavor(networkErrorFlavor);
                newNetworkErrorFlavor();
            });
    }

    let warn = connection === "disconnected" || connection === "errored";

    return (
        <UI.Menu>
            <form id="join-game-menu" autocomplete="on">
                <MenuLayout>
                    <UI.ColumnToRow>
                        <JoinText>
                            Have you been given a Game ID?
                        </JoinText>
                        <UI.Flavor light warn={warn}>{flavor}</UI.Flavor>
                    </UI.ColumnToRow>
                    <UI.ColumnToRow>
                        <InputRow>
                            <UI.FAIcon icon={icons.faKey}
                                       color={theme.colors.secondary}
                                       fixedWidth transform="grow-5" />
                            <MenuInput monospace id="join-game-id"
                                       placeholder={"Game ID"}
                                       autoComplete="on" autocapitalize="none"
                                       spellcheck="false"
                                       value={gameID} onChange={onGameIDChange}
                                       disabled={connection === "connecting"} />
                        </InputRow>
                        <InputRow>
                            <UI.FAIcon icon={icons.faUser}
                                       color={theme.colors.secondary}
                                       fixedWidth transform="grow-5" />
                            <MenuInput id="join-player-name"
                                       placeholder={"Player name"}
                                       autoComplete="on" autocapitalize="words"
                                       spellcheck="false"
                                       value={playerName} onChange={onPlayerNameChange}
                                       disabled={connection === "connecting"} />
                        </InputRow>
                    </UI.ColumnToRow>
                    <ButtonZone>
                        <UI.RadioLink type="checkbox" id="join-game-persist"
                                      name="Remember this gameID"
                                      checked={persist} onChange={e => setPersist(e.target.checked)}
                                      disabled={!ready}>
                            {persistFlavor}
                        </UI.RadioLink>
                        {connection === "connecting" ? <UI.DiceSpinner /> : ''}
                        <UI.LinkButton light id="join-game-submit"
                                       onClick={onSubmit}
                                       disabled={!ready}>
                            Join
                        </UI.LinkButton>
                    </ButtonZone>
                </MenuLayout>
            </form>
        </UI.Menu>
    )
}
