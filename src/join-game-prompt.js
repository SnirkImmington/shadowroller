//  @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as style from 'style';

import * as Game from 'game';
import * as Event from 'event';

import { requestJoin } from 'server';
import { useFlavor } from 'srutil';

const JOIN_FLAVOR = [
    "See you on the flip side.",
    "Good luck out there.",
];

const LOADING_FLAVOR = [
    "Hacking you in...",
    "Acquiring marks...",
    "Authenticating...",
    "Acquiring intel...",
    "Starting the run...",
    "Contacting Mr. J...",
    "Hack on the Fly-ing...",
    "Brute Force-ing...",
];

// const slideDown = keyframes`
//     0% { max-height: 0 }
//     100% { max-height: auto }
// `;

const BoxTitle = styled.span`
    margin-left: auto;
    margin-right: auto;
    font-weight: bold;
    margin-top: 5px;
`;

const Explanation = styled.span`
    color: #666;
`;

const Form = styled.div`
    display: flex;
    flex-direction: column;
`;

const FormRow = styled(style.FlexRow)`
    margin: .5em 0px;
    justify-content: flex-end;
    flex-wrap: wrap;
`;

const FormLabel = styled.label`
    margin: auto 5px;
    /*margin-right: 0.5em;*/
    /*flex-basis: 0;*/
`;

const Input = styled.input`
    /*border-radius: 0px;*/
`;

const GameIDInput = styled(Input)`
    font-family: monospace;
`;

const JoinButton = styled(style.Button)`

`;


type JoinStatus = "incomplete"|"ready"|"loading"|"error";

type StatusProps = {
    +status: JoinStatus
}
function StatusIndicator({ status }: StatusProps) {
    const joinFlavor = useFlavor(JOIN_FLAVOR);
    const loadFlavor = useFlavor(LOADING_FLAVOR);

    if (status === "ready") {
        return (
            <i>{joinFlavor}</i>
        );
    }
    else if (status === "incomplete") {
        return (
            "set a name and game"
        );
    }
    else if (status === "loading") {
        return (
            <style.FlexRow>
                <i>{loadFlavor}</i>
                <style.DiceSpinner />
            </style.FlexRow>
        );
    }
    else if (status === "error") {
        return "Could not join that game.";
    }
    else { // should not happen
        return '';
    }
}

type Props = {
    +game: Game.State;
    +setShown: (bool) => void
};
export default function JoinGamePrompt({ game, setShown }: Props) {
    const gameDispatch = React.useContext(Game.DispatchCtx);
    const eventDispatch = React.useContext(Event.DispatchCtx);
    const [gameID, setGameID] = React.useState('');
    const [playerName, setPlayerName] = React.useState('');
    const [status, setStatus] = React.useState<JoinStatus>("incomplete");

    React.useEffect(() =>
        setStatus(status =>
            status === "incomplete"
            && gameID !== ""
            && playerName !== ""
            ? "ready" : status
        ),
        [status, gameID, playerName]
    );

    const onGameIDChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        const gameID = event.target.value ?? '';
        setGameID(gameID);
        setStatus(status => gameID === '' ? "incomplete" : status);
    };

    const onPlayerNameChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
        const playerName = event.target.value ?? '';
        setPlayerName(playerName);
        setStatus(status => playerName === '' ? "incomplete" : status);
    };

    function onSubmit(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        setStatus("loading");
        requestJoin(gameID, playerName)
            .then(resp => {
                setStatus("ready");
                setShown(false);
                gameDispatch({
                    ty: "join", gameID,
                    player: { id: resp.playerID, name: playerName },
                    players: resp.players
                });
            })
            .catch(err => {
                console.log("Error connecting:", err);
                setStatus("error");
            });
    }

    function leaveGameClicked(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        setStatus("ready");
        gameDispatch({
            ty: "connect", connected: false
        });
        eventDispatch({
            ty: "gameConnect", connected: false
        });
        //document.cookie = "srAuth=no; Max-Age=0";
    }

    return (
        <style.Card color="dimGray">
            <BoxTitle>Join Game</BoxTitle>
            <Explanation className="form-text">
                Join a game if you've been given a Game ID.
            </Explanation>
            <form id="join-game-form">
                <Form>
                    <FormRow>
                        <FormLabel htmlFor="join-game-id">
                            Game ID
                        </FormLabel>
                        <GameIDInput type="text"
                                     id="join-game-id"
                                     onChange={onGameIDChange}
                                     value={gameID}
                                     disabled={status === "loading"} />
                    </FormRow>
                    <FormRow>
                        <FormLabel htmlFor="join-game-player-name">
                            Player Name
                        </FormLabel>
                        <Input type="text"
                               id="join-game-player-name"
                               onChange={onPlayerNameChange}
                               value={playerName}
                               disabled={status === "loading"} />
                    </FormRow>
                    <FormRow>
                        {game ?
                            <style.Button id="leave-game-submit"
                                    onClick={leaveGameClicked}>
                                Leave
                            </style.Button>
                            : ''
                        }
                        <FormLabel htmlFor="join-game-submit">
                            <StatusIndicator status={status} />
                        </FormLabel>
                        <JoinButton id="join-game-submit"
                                    onClick={onSubmit}
                                    disabled={status !== "ready"}
                                    >
                            Join
                        </JoinButton>
                    </FormRow>
                </Form>
            </form>
        </style.Card>
    )
}
