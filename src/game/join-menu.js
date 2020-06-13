// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
// import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import theme from 'style/theme';
import * as icons from 'style/icon';

import * as Game from 'game';
import * as Event from 'event';

import * as server from 'server';
import * as srutil from 'srutil';

const ENTER_GAME_ID_FLAVOR = [
    "I hope you've got a good fake.",
    <span><tt>password12345</tt> is not a Game ID.</span>,
    <span><tt>deckerpizza</tt> is not a Game ID.</span>,
    <span><tt>bikinitrolls</tt> is not a Game ID.</span>,
    <span><tt>aimattrees</tt> is not a Game ID.</span>,
    <span><tt>foofaraw</tt> is not a Game ID.</span>,

    "Show some ID, chummer.",
    "Gimme a real one this time.",

    "Pull out your best SIN.",
    "You'll need at least an R4 SIN.",
    "I dare you to use your real SIN.",
    "Corporate SINs not accepted.",
    "We probably won't burn your SIN.",

    "Wow, so exclusive.",
];
const LOADING_FLAVOR = [
    "Hacking you in...",
    "Acquiring marks...",
    "Asking for permission...",
];
const NOT_FOUND_FLAVOR = [
    "I don't think that Game ID exists.",
    "You put in the right Game ID?",
    "Game ID first, then player name.",
    "That's not a game ID, chummer.",
    "That's no Game ID!",
    "SIN scanner caught you on that one."
];
const SERVER_ERROR_FLAVOR = [
    "Something went wrong with the server.",
    "The server is having an issue.",
    "Server glitched attempting to check your ID.",
];
const NO_CONNECTION_FLAVOR = [
    "Can't connect to the server.",
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
    justify-content: space-between;
    margin-top: .5em;
    @media all and (min-width: 768px) {
        margin-top: 0px;
        margin-left: 2rem;
    }
`;

const SpacedFlavor = styled(UI.Flavor)`
    margin-left: 1em;

    @media all and (min-width: 768px) {
        margin: 0 1.5em 0 1.5em;
    }
`;

type Props = {
    +connection: server.Connection,
    +setConnection: server.SetConnection,
    +hide: () => void,
    +dispatch: Game.Dispatch,
    +eventDispatch: Event.Dispatch,
};
export function JoinMenu({ connection, setConnection, hide, dispatch, eventDispatch }: Props) {
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
                if (process.env.NODE_ENV !== "production") {
                    console.log("Join success", resp);
                }
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
                switch (server.statusFor(resp)) {
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
                setConnection(server.connectionFor(resp));
            });
    }

    let warn = connection === "disconnected" || connection === "errored";

    return (
        <UI.Menu>
            <form id="join-game-menu">
                <MenuLayout>
                    <JoinText>
                        Join a game if you've been given a Game ID.
                    </JoinText>
                    <UI.ColumnToRow>
                    <InputRow>
                        <UI.FAIcon fixedWidth icon={icons.faKey} transform="grow-5" color={theme.colors.secondary} />
                        <UI.Input monospace id="join-game-id"
                                  placeholder={"Game ID"}
                                  value={gameID} onChange={onGameIDChange}
                                  disabled={connection === "connecting"} />
                    </InputRow>
                    <InputRow>
                        <UI.FAIcon fixedWidth icon={icons.faUser} transform="grow-5" color={theme.colors.secondary} />
                        <UI.Input id="join-player-name"
                                  placeholder={"Player name"}
                                  value={playerName} onChange={onPlayerNameChange}
                                  disabled={connection === "connecting"} />
                    </InputRow>
                    </UI.ColumnToRow>
                    <ButtonZone>
                        <SpacedFlavor light warn={warn}>{flavor}</SpacedFlavor>
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
