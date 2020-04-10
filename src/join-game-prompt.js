//  @flow

import * as React from 'react';
import styled from 'styled-components/macro';

import { AppWideBox, Button, DiceSpinner, FlexCenter } from 'style';

import { GameDispatchCtx } from 'game/state';
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
]

const Prompt = styled(AppWideBox)`
    border-top: 4px solid #2d2db3;

    display: flex;
    flex-direction: column;
`;

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

const FormRow = styled.div`
    margin: .5em 0px;
    display: flex;
    align-items: center;
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

const JoinButton = styled(Button)`

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
            <FlexCenter>
                <i>{loadFlavor}</i>
                <DiceSpinner />
            </FlexCenter>
        );
    }
    else if (status === "error") {
        return "Could not join that game.";
    }
    else { // should not happen
        return '';
    }
}
type Props = { +setShown: (bool) => any };
export default function JoinGamePrompt({ setShown }: Props) {
    const gameDispatch = React.useContext(GameDispatchCtx);
    const [gameID, setGameID] = React.useState('');
    const [playerName, setPlayerName] = React.useState('');
    const [status, setStatus] = React.useState<JoinStatus>("incomplete");

    function updateInputStatus() {
        if (gameID !== "" && playerName !== "") {
            setStatus("ready");
        }
        else {
            setStatus("incomplete");
        }
    }

    function onGameIDChange(event: SyntheticInputEvent<HTMLInputElement>) {
        setGameID(event.target.value ?? '');
        updateInputStatus();
    }

    function onPlayerNameChange(event: SyntheticInputEvent<HTMLInputElement>) {
        setPlayerName(event.target.value ?? '');
        updateInputStatus();
    }

    function onSubmit(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        setStatus("loading");
        // setStatus("ready"); setShown(false);
    }

    return (
        <Prompt>
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
                                     disabled={status === "loading"} />
                    </FormRow>
                    <FormRow>
                        <FormLabel htmlFor="join-game-player-name">
                            Player Name
                        </FormLabel>
                        <Input type="text"
                               id="join-game-player-name"
                               onChange={onPlayerNameChange}
                               disabled={status === "loading"} />
                    </FormRow>
                    <FormRow>
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
        </Prompt>
    )
}
