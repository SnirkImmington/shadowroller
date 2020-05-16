// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
// import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import NumericInput from 'components/numeric-input';

import * as Event from 'event';
import * as server from 'server';
import * as srutil from 'srutil';

const ROLL_TITLE_FLAVOR = [
    "look good in a suit",
    "swipe the key card",
    "negotiate for more pay",
    "dodge", "dodge", "dodge",
    "recover from last night's party",
    "geek the mage",
    "not freak out",
    "sneak past the guards",
    "hack the vending machine",
    "fly the shuttle",
    "palm the data chip",
    "hack the planet",
    "punch this guy",
    "repair my cyberarm",
    "acquire target lock",
    "break target lock",

    "punch a hole in the wall",
    "punch a hole in the door",
    "punch a hole in the floor",
    "punch a hole through the window",
    "punch a hole in the elf",
    "repair the hole in the wall",
    "repair the hole in the door",

    "swipe the statue",
    "aim the torpedos",
    "avoid looking at the explosion",
    "hack the planet",

    "backflip out of the plane",
    "pilot my drone under the door",
    "gamble",
    "place explosives",
    "peer into the depths",
    "repair the juggernaut",
    "turn the world to chaos",

    "Judge Intentions on Mr. J",
    "hack the cleaning drone",
    "pick a Hawaiian shirt",
    "shoot through the water tank",
    "connoiseur: alcohol",
    "not die to the spirit",
    "animate objects",
    "turn invisible",

    "drive through the storm",
    "not spray more tags",
    "win the bike race",
    "identify the gang",
    "play the guitar",

    "slice with zappy sword",
    "soak 6 rounds of burst fire",
    "throw the deck",
    "prepare",
    "swipe George's ID card",
    "pretend to be George",
];

const ButtonRow = styled(UI.FlexRow)`
    margin: .75rem .5rem;
    justify-content: flex-end;
`;

const RollInputRow = styled(UI.FlexRow)`
    margin: .75rem .5rem;
`;

const TitleRow = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

const FormLabel = styled.label`
    margin: 0;
    /*margin-right: 0.5em;*/
    /*flex-basis: 0;*/
`;

const RollButton = styled(UI.Button)`
    background-image: linear-gradient(180deg, #52605e 0, #3f4946);
    font-size: 1.05em;
    color: #ccc;
    font-weight: 600;
    padding: .3rem .7rem;

    & :not(:disabled) {
        background-image: linear-gradient(180deg, #394341 0, #232928);
        color: white;
    }
`;

const RollToLabel = styled.label`
    margin-left: .5rem;
    margin-right: 1.3em;

    @media all and (min-width: 768px) {
        margin: 0 .5rem 0 0;
    }
`;

type Props = {
    +connection: server.Connection;
    +dispatch: Event.Dispatch;
};
export default function RollDicePrompt({ connection, dispatch }: Props) {
    const [diceCount, setDiceCount] = React.useState<?number>(null);
    const [rollLoading, setRollLoading] = React.useState(false);
    const [localRoll, setLocalRoll] = React.useState(false);
    const [title, setTitle] = React.useState('');
    const [titleFlavor, setTitleFlavor] = React.useState(
        () => srutil.pickRandom(ROLL_TITLE_FLAVOR)
    );

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
            dispatch({
                ty: "localRoll",
                dice,
                title: title,
            });
        }
        else {
            setRollLoading(true);
            server.postRoll({ count: diceCount, title: title })
                .then(res => {
                    setRollLoading(false);
                })
                .catch((err: mixed) => {
                    console.log("Error rolling:", err);
                    setRollLoading(false);
                });
        }
        setTitle('');
        if (Math.floor(Math.random() * 4) === 0) {
            setTitleFlavor(srutil.pickRandom(ROLL_TITLE_FLAVOR));
        }
    }

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
                        <NumericInput controlId="roll-select-dice"
                                      min={1} max={99}
                                      onSelect={setDiceCount} />
                        <FormLabel htmlFor="roll-select-dice">
                            dice
                        </FormLabel>
                    </RollInputRow>
                    <UI.FlexRow>
                        <RollToLabel htmlFor="roll-title">
                            to
                        </RollToLabel>
                        <input type="text" id="roll-title"
                               placeholder={titleFlavor}
                               onChange={rollTitleChanged}
                               value={title} />
                    </UI.FlexRow>
                </UI.ColumnToRow>
                <ButtonRow>
                    <input type="checkbox" id="toggle-local-roll"
                           disabled={!connected} checked={localRoll || !connected}
                           onChange={rollLocalClicked} />
                    <label htmlFor="toggle-local-roll"
                           style={{marginBottom: 0, marginLeft: ".25em", marginRight: ".25em"}}>
                        Roll locally
                    </label>
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
