// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';
import * as icons from 'style/icon';

import * as Game from 'game';
import * as Event from 'event';
import { statusFor, connectionFor, ConnectionCtx, SetConnectionCtx } from 'connection';

import * as server from 'server';
import * as srutil from 'srutil';

const ENTER_GAME_ID_FLAVOR = [
    "I hope you've got a good fake.",
    <span><tt>password12345</tt> is not a Game ID.</span>,
    <span><tt>deckerpizza</tt> is not a Game ID.</span>,
    <span><tt>bikinitrolls</tt> is not a Game ID.</span>,
    <span><tt>aimattrees</tt> is not a Game ID.</span>,
    <span><tt>foofaraw</tt> is not a Game ID.</span>,

    "Gimme a real one this time.",

    "Pull out your best SIN.",
    "You'll need at least an R4 SIN.",
    "I dare you to use your real SIN.",
    "Corporate SINs not accepted.",
    "We probably won't burn your SIN.",

    "Wow, so exclusive.",
    "Or you're just curious, I guess.",
];
const LOADING_FLAVOR = [
    "Hacking you in...",
    "Acquiring marks...",
    "Accessing game node...",
    "Asking for permission...",
];
const NOT_FOUND_FLAVOR = [
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
    padding: 0px 0.25rem;
    @media all and (min-width: 768px) {
        padding: 0px 1em;
        align-items: center;
        margin-left: 2rem;
    }
`;

const InputRow = styled.div`
    margin-bottom: 0.5rem;
    @media all and (min-width: 768px) {
        margin-bottom: 0;
    }
`;

const JoinText = styled.span`
    line-height: 1.25;
    margin-right: auto;

    margin-bottom: 0.5rem;
    @media all and (min-width: 768px) {
        margin-bottom: 0;
    }
`;

const ButtonZone = styled(UI.FlexRow)`
    /* Mobile: last row, button on the right */
    margin-left: auto;
    padding: 0.5em;
    @media all and (min-width: 768px) {
        margin-top: 0px;
    }
`;

const SpacedFlavor = styled(UI.Flavor)`
    line-height: 1.5;
    margin-bottom: .5em;
    @media all and (min-width: 768px) {
        margin: 0 1.5em 0 1.5em;
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

    const [gameID, setGameID] = React.useState('');
    const [playerName, setPlayerName] = React.useState('');

    const [enterIDFlavor] = srutil.useFlavor(ENTER_GAME_ID_FLAVOR);
    const [connectingFlavor, newConnecting] = srutil.useFlavor(LOADING_FLAVOR);
    const [noConnectionFlavor, newNoConnection] = srutil.useFlavor(NO_CONNECTION_FLAVOR);
    const [notFoundFlavor, newNotFound] = srutil.useFlavor(NOT_FOUND_FLAVOR);
    const [serverErrorFlavor, newServerError] = srutil.useFlavor(SERVER_ERROR_FLAVOR);

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

        setConnection("connecting");
        setFlavor(connectingFlavor);
        newConnecting();
        server.requestJoin(gameID, playerName)
            .then(resp => {
                dispatch({
                    ty: "join",
                    gameID: gameID,
                    player: { id: resp.playerID, name: playerName },
                    players: resp.players
                });
                setConnection("connected");
                hide();
                eventDispatch({ ty: "setHistoryFetch", state: "fetching" });
                // flow-ignore-all-next-line
                return server.fetchEvents({ oldest: resp.newestID });
            })
            .then(resp => {
                eventDispatch({
                    ty: "setHistoryFetch", state: resp.more ? "ready" : "finished"
                });
                eventDispatch({
                    ty: "mergeEvents", events: resp.events
                });
            })
            .catch((resp: Response) => {
                switch (statusFor(resp)) {
                    case "badRequest":
                        setFlavor(notFoundFlavor);
                        newNotFound();
                        break;
                    case "serverError":
                        setFlavor(serverErrorFlavor);
                        newServerError();
                        break;
                    case "noConnection":
                        setFlavor(noConnectionFlavor);
                        newNoConnection();
                        break;
                    default:
                }
                setConnection(connectionFor(resp));
            });
    }

    let warn = connection === "disconnected" || connection === "errored";

    return (
        <UI.Menu>
            <form id="join-game-menu">
                <MenuLayout>
                    <UI.ColumnToRow>
                        <JoinText>
                            Join a game if you've been given a Game ID.
                            </JoinText>
                            <SpacedFlavor light warn={warn}>{flavor}</SpacedFlavor>
                    </UI.ColumnToRow>
                    <UI.ColumnToRow>
                        <InputRow>
                            <UI.FAIcon icon={icons.faKey}
                                       color={theme.colors.secondary}
                                       fixedWidth transform="grow-5" />
                            <UI.Input monospace id="join-game-id"
                                      placeholder={"Game ID"}
                                      value={gameID} onChange={onGameIDChange}
                                      disabled={connection === "connecting"} />
                        </InputRow>
                        <InputRow>
                            <UI.FAIcon icon={icons.faUser}
                                       color={theme.colors.secondary}
                                       fixedWidth transform="grow-5" />
                            <UI.Input id="join-player-name"
                                      placeholder={"Player name"}
                                      value={playerName} onChange={onPlayerNameChange}
                                      disabled={connection === "connecting"} />
                        </InputRow>
                    </UI.ColumnToRow>
                    <ButtonZone>
                        {connection === "connecting" ? <UI.DiceSpinner /> : ''}
                        <UI.Button id="join-game-submit" onClick={onSubmit}
                                   disabled={!ready}>
                            Join
                        </UI.Button>
                    </ButtonZone>
                </MenuLayout>
            </form>
        </UI.Menu>
    )
}
