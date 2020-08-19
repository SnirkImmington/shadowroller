// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import NumericInput from 'numeric-input';

import * as Game from 'game';
import * as Event from 'event';
import { ConnectionCtx } from 'connection';
import routes from 'routes';
import * as srutil from 'srutil';

const ROLL_TITLE_FLAVOR = [
    "look good in a suit",
    "swipe the key card",
    "negotiate for more pay",
    "eavesdrop on the business meeting",
    "maniuplate the exec into revealing her plans",

    "avoid the oncoming shrapnel",
    "duck out of the way of the troll",

    "recover from last night's party",
    "geek the mage",
    "not freak out",
    "sneak past the guards",
    "convince the cops I'm just passing through",
    "hack the vending machine",
    "hack into the mainframe",
    "palm the data chip",
    "acquire target lock",
    "break target lock",

    "punch a hole in the wall",
    "punch a hole in the door",
    "punch a hole in the elf",
    "repair the hole in the wall",
    "repair the hole in the door",

    "swipe the statue",
    "aim the torpedos",
    "avoid looking at the explosion",

    "gamble on the virtual horse racing",
    "backflip out of the plane",
    "pilot my drone under the door",
    "place explosives",
    "repair the juggernaut",
    "turn the world to chaos",
    "hack the grenade",

    "hack the cleaning drone",
    "grapple off the ship",
    "pick a Hawaiian shirt",
    "shoot through the water tank",
    "connoiseur: alcohol",
    "not die to the spirit",
    "animate objects",
    "hack the cupcake",
    "catch the hacker",

    "drive through the storm",
    "not spray more tags",
    "win the bike race",
    "identify the gang",
    "play the guitar",
    "run from the bear",
    "find the bandit",
    "jump through the air duct",
    "fireball the door",
    "shoot between the hostages",
    "pretend to be a chef",
    "smuggle in handcuffs",
    "remember the cocktail list",
    "practice blooood magic",

    "slice with zappy sword",
    "soak 6 rounds of burst fire",
    "throw the deck",
    "swipe George's ID card",
    "pretend to be George",
    "throw a knife",
    "brick the security system",
    "shoot down the bugs",
    "inspire the intern",
    "wave a sword cane helpfully",
    "summon the zeppelin",
];

const ButtonRow = styled(UI.FlexRow)`
    & > *:first-child {
        margin-left: 0;
    }
    & > *:last-child {
        margin-left: auto;
        margin-right: 0.5em;
    }
`;

const RollInputRow = styled(UI.FlexRow)`
    margin: 0.75rem 0;

    @media all and (min-width: 768px) {
        margin: 0.5rem;
    }
`;

const TitleRow = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

const FormLabel = styled.label`
`;

const RollButton = styled.button`
    font-size: 1.07em;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    padding: .3rem .7rem;
    border: 0;

    color: white;
    background-image: linear-gradient(180deg, #394341 0, #232928);

    &:hover {
        text-decoration: none;
    }

    &:active {
        background-image: linear-gradient(180deg, #263427 0, #192423);
    }

    &[disabled] {
        pointer-events: none;
        cursor: not-allowed;
        color: #ccc;
        background-image: linear-gradient(180deg, #52605e 0, #3f4946);
    }
`;

const RollToLabel = styled.label`
`;

const RollTitleInput = styled(UI.Input).attrs({ expand: true})`
    height: calc(1em + 10px);
    /* Mobile: full width - "name rolls to" */
    width: calc(100vw - 5em);

    @media all and (min-width: 768px) {
        width: 23em;
    }
`;

export default function RollDicePrompt() {
    const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const dispatch = React.useContext(Event.DispatchCtx);

    const [rollLoading, setRollLoading] = React.useState(false);
    const [titleFlavor, newTitleFlavor] = srutil.useFlavor(ROLL_TITLE_FLAVOR);

    const [diceCount, setDiceCount] = React.useState<?number>(null);
    const [title, setTitle] = React.useState('');
    const [edge, setEdge] = React.useState(false);
    const [localRoll, setLocalRoll] = React.useState(false);

    const connected = connection === "connected";
    const rollDisabled = (
        rollLoading || !diceCount || diceCount < 1 || diceCount > 100
    );

    function rollTitleChanged(event: SyntheticInputEvent<HTMLInputElement>) {
        setTitle(event.target.value || '');
    }

    const rollLocalClicked = React.useCallback(
        (event) => setLocalRoll(l => !l),
        [setLocalRoll]
    );


    const onEdgeClicked = React.useCallback(
        (event) => setEdge(event.target.checked),
        [setEdge]
    );

    function onRollClicked(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        if (!diceCount) { return; }
        if (localRoll || !connected) {
            let localRoll: Event.Event;
            if (edge) {
                const rounds = srutil.rollExploding(diceCount);
                localRoll = {
                    ty: "edgeRoll", source: "local", id: Event.newID(),
                    title, rounds,
                };
            }
            else {
                const dice = srutil.roll(diceCount);
                localRoll = {
                    ty: "roll", source: "local", id: Event.newID(),
                    title, dice,
                };
            }
            dispatch({ ty: "newEvent", event: localRoll });
        }
        else {
            setRollLoading(true);
            routes.game.roll({ count: diceCount, title, edge })
                .onDone((res, full) => {
                    setRollLoading(false);
                    if (!res && process.env.NODE_ENV !== "production") {
                        console.log("Error rolling:", full);
                    }
                });
        }
        setTitle('');
        if (Math.floor(Math.random() * 2.6) === 0) {
            newTitleFlavor();
        }
    }

    const numericInput = React.useMemo(() => (
        <NumericInput id="roll-select-dice" min={1} max={99} onSelect={setDiceCount} />
    ), [setDiceCount]);

    // roll title gets game state, dispatch useLocalRoll
    return (
        <UI.Card color="#81132a">
            <TitleRow>
                <UI.CardTitleText color="#81132a">Roll Dice</UI.CardTitleText>
                <UI.FlexRow>
                </UI.FlexRow>
            </TitleRow>
            <form id="dice-input" onSubmit={onRollClicked}>
                <UI.ColumnToRow>
                    <RollInputRow>
                        <FormLabel htmlFor="roll-select-dice">
                            Roll
                        </FormLabel>
                        {numericInput}
                        <FormLabel htmlFor="roll-select-dice">
                            dice
                        </FormLabel>
                    </RollInputRow>
                    <UI.FlexRow>
                        <RollToLabel htmlFor="roll-title">
                            to
                        </RollToLabel>
                        <RollTitleInput id="roll-title"
                                        placeholder={titleFlavor}
                                        onChange={rollTitleChanged}
                                        value={title} />
                    </UI.FlexRow>
                    <UI.FlexRow maxWidth>
                        <UI.RadioLink id="roll-enable-edge"
                                      type="checkbox" light
                                      checked={edge}
                                      onChange={onEdgeClicked}>
                            Push the limit
                        </UI.RadioLink>
                    </UI.FlexRow>
                </UI.ColumnToRow>
                <ButtonRow>
                    {connected ?
                        <>
                            <UI.RadioLink id="roll-set-in-game"
                                          name="roll-location"
                                          type="radio" light
                                          checked={!localRoll}
                                          onChange={rollLocalClicked}>
                                in&nbsp;<tt>{game?.gameID ?? "game"}</tt>
                            </UI.RadioLink>
                            <UI.RadioLink id="roll-set-local"
                                          name="roll-location"
                                          type="radio" light
                                          checked={localRoll}
                                          onChange={rollLocalClicked}>
                                locally
                            </UI.RadioLink>
                        </>
                    : ''}
                    <RollButton id="roll-button-submit" type="submit"
                                disabled={rollDisabled}
                                onClick={onRollClicked}>
                        Roll dice
                    </RollButton>
                </ButtonRow>
            </form>
        </UI.Card>
    );
}
