// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import NumericInput from 'numeric-input';

import * as Event from 'event';
import { ConnectionCtx } from 'connection';
import * as server from 'server';
import * as srutil from 'srutil';

const ROLL_TITLE_FLAVOR = [
    "look good in a suit",
    "swipe the key card",
    "negotiate for more pay",
    "eavesdrop on the business meeting",
    "maniuplate the exec into revealing her plans",

    "dodge some bullets",
    "take cover from a grenade",
    "catch a knife in midair",
    "avoid the oncoming shrapnel",
    "duck out of the way of the troll",

    "recover from last night's party",
    "geek the mage",
    "not freak out",
    "sneak past the guards",
    "convince the cops I'm just passing through",
    "hack the vending machine",
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
    "hack the planet",

    "gamble on the virtual horse racing",
    "backflip out of the plane",
    "pilot my drone under the door",
    "place explosives",
    "peer into the depths",
    "repair the juggernaut",
    "turn the world to chaos",
    "hack the grenade",

    "hack the cleaning drone",
    "grapple off of the ship",
    "pick a Hawaiian shirt",
    "shoot through the water tank",
    "connoiseur: alcohol",
    "not die to the spirit",
    "animate objects",
    "hack the cupcake",

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

    "slice with zappy sword",
    "soak 6 rounds of burst fire",
    "throw the deck",
    "swipe George's ID card",
    "pretend to be George",
    "throw a knife",
];

const ButtonRow = styled(UI.FlexRow)`
    margin: .75rem .5rem;
    justify-content: flex-end;
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
    const dispatch = React.useContext(Event.DispatchCtx);
    const [diceCount, setDiceCount] = React.useState<?number>(null);
    const [rollLoading, setRollLoading] = React.useState(false);
    const [localRoll, setLocalRoll] = React.useState(false);
    const [title, setTitle] = React.useState('');
    const [titleFlavor, newTitleFlavor] = srutil.useFlavor(ROLL_TITLE_FLAVOR);

    const connected = connection === "connected";
    const rollDisabled = (
        rollLoading || !diceCount || diceCount < 1 || diceCount > 100
    );
    function rollTitleChanged(event: SyntheticInputEvent<HTMLInputElement>) {
        setTitle(event.target.value || '');
    }

    function rollLocalClicked(event: SyntheticInputEvent<HTMLInputElement>) {
        setLocalRoll(prev => !prev);
    }

    function onRollClicked(event: SyntheticInputEvent<HTMLButtonElement>) {
        event.preventDefault();
        if (!diceCount) { return; }
        if (localRoll || !connected) {
            const dice = srutil.roll(diceCount);
            const localRoll: Event.LocalRoll = {
                ty: "localRoll", ts: new Date().valueOf(), title, dice
            };
            dispatch({ ty: "newEvent", event: localRoll });
        }
        else {
            setRollLoading(true);
            server.postRoll({ count: diceCount, title: title })
                .then(res => {
                    setRollLoading(false);
                })
                .catch((err: mixed) => {
                    if (process.env.NODE_ENV !== "production") {
                        console.log("Error rolling:", err);
                    }
                    setRollLoading(false);
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
                    <UI.FlexRow maxWidth>
                        <RollToLabel htmlFor="roll-title">
                            to
                        </RollToLabel>
                        <RollTitleInput id="roll-title"
                                        placeholder={titleFlavor}
                                        onChange={rollTitleChanged}
                                        value={title} />
                    </UI.FlexRow>
                </UI.ColumnToRow>
                <ButtonRow>
                    {connected ?
                        <>
                            <input type="checkbox" id="toggle-local-roll"
                                   checked={localRoll} onChange={rollLocalClicked} />
                            <label htmlFor="toggle-local-roll"
                                   style={{marginBottom: 0, marginLeft: ".25em", marginRight: ".25em"}}>
                                Roll locally
                            </label>
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
