// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import NumericInput from 'numeric-input';

import * as Game from 'game';
import * as Event from 'event';
import { ConnectionCtx } from 'connection';
import routes from 'routes';
import * as srutil from 'srutil';
import theme from 'style/theme';

export const ROLL_TITLE_FLAVOR: string[] = [
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
    "eavesdrop on the queen",
    "send in the red team",

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
    "practice blood magic",
    "shoot the bandit",

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

const TitleRow = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

const RollBackground = {
    inGame: `linear-gradient(180deg, #783442 0, #601010)`,
    edgy: `linear-gradient(180deg, #ba4864 0, #cc365b)`,
    regular: `linear-gradient(180deg, #394341 0, #232928)`
}

const RollButton: StyledComponent<{ bg: string} > = styled.button`
    font-size: 1.07em;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    padding: .3rem .7rem;
    border: 0;

    color: white;
    background-image: ${props => props.bg};

    &:hover {
        text-decoration: none;
    }

    &:active {
        filter: brightness(85%);
    }

    &[disabled] {
        pointer-events: none;
        cursor: not-allowed;
        color: #ccc;
        filter: saturate(40%) brightness(85%);
    }
`;

const RollTitleInput = styled(UI.Input).attrs({ expand: true})`
    height: calc(1em + 10px);
    /* Mobile: full width - "name rolls to" */
    width: calc(100vw - 5em);

    @media all and (min-width: 768px) {
        width: 23em;
    }
`;

const RollGlitchyLabel = styled.label`
    padding: .5em;
    @media all and (min-width: 768px) {
        padding: 0;
    }
`;

export default function RollDicePrompt() {
    const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const dispatch = React.useContext(Event.DispatchCtx);

    const [shown, setShown] = React.useState(true);
    const toggleShown = React.useCallback(() => setShown(s => !s), [setShown]);
    const [rollLoading, setRollLoading] = React.useState(false);
    const [titleFlavor, newTitleFlavor] = srutil.useFlavor(ROLL_TITLE_FLAVOR);

    const [diceCount, setDiceCount] = React.useState<?number>(null);
    const [title, setTitle] = React.useState('');
    const [edge, setEdge] = React.useState(false);
    const [glitchy, setGlitchy] = React.useState(0);
    const [localRoll, setLocalRoll] = React.useState(false);

    const connected = connection === "connected";
    const rollDisabled = (
        rollLoading || !diceCount || diceCount < 1 || diceCount > 100
    );

    const rollBackgound = connected && !localRoll ?
        (edge ? RollBackground.edgy : RollBackground.inGame)
        : RollBackground.regular;

    function rollTitleChanged(event: SyntheticInputEvent<HTMLInputElement>) {
        setTitle(event.target.value || '');
    }

    const rollLocalClicked = React.useCallback(() => setLocalRoll(l => !l), [setLocalRoll]);

    const onEdgeClicked = React.useCallback(
        (event) => setEdge(event.target.checked),
        [setEdge]
    );

    const onGlitchyClicked = React.useCallback(
        (e) => setGlitchy(g => g === 0 ? 1 : 0),
        [setGlitchy]
    );

    const setRollGlitchy = React.useCallback(
        (g: ?number) => { g != null && setGlitchy(g); },
        [setGlitchy]
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
                    title, rounds, glitchy,
                };
            }
            else {
                const dice = srutil.roll(diceCount);
                localRoll = {
                    ty: "roll", source: "local", id: Event.newID(),
                    title, dice, glitchy,
                };
            }
            dispatch({ ty: "newEvent", event: localRoll });
        }
        else {
            setRollLoading(true);
            routes.game.roll({ count: diceCount, title, edge, glitchy })
                .onDone((res, full) => {
                    setRollLoading(false);
                    if (!res && process.env.NODE_ENV !== "production") {
                        console.log("Error rolling:", full);
                    }
                });
        }
        setTitle('');
        setEdge(false);
        setGlitchy(0);
        if (Math.floor(Math.random() * 2.64) === 0) {
            newTitleFlavor();
        }
    }

    const numericInput = React.useMemo(() => (
        <NumericInput id="roll-select-dice"
                      min={1} max={99}
                      onSelect={setDiceCount} />
    ), [setDiceCount]);

    if (!shown) {
        return (
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>
                    Roll Dice
                </UI.CardTitleText>
                <UI.LinkButton minor onClick={toggleShown}>
                    show
                </UI.LinkButton>
            </UI.FlexRow>
        );
    }

    // roll title gets game state, dispatch useLocalRoll
    return (
        <UI.Card color={theme.colors.primary}>
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>Roll Dice</UI.CardTitleText>
                <UI.LinkButton minor onClick={toggleShown}>
                    hide
                </UI.LinkButton>
            </UI.FlexRow>
            <form id="dice-input" onSubmit={onRollClicked}>
                <UI.ColumnToRow>
                    <UI.FlexRow formRow>
                        <label htmlFor="roll-select-dice">
                            Roll
                        </label>
                        {numericInput}
                        <label htmlFor="roll-select-dice">
                            dice
                        </label>
                        &nbsp;
                    </UI.FlexRow>
                    <UI.FlexRow formRow>
                        <label htmlFor="roll-title">
                            to
                        </label>
                        <RollTitleInput id="roll-title"
                                        placeholder={titleFlavor}
                                        onChange={rollTitleChanged}
                                        value={title} />
                    </UI.FlexRow>
                    <UI.FlexRow formRow>
                        <UI.RadioLink id="roll-enable-edge"
                                      type="checkbox" light
                                      checked={edge}
                                      onChange={onEdgeClicked}>
                            Push the limit
                        </UI.RadioLink>
                    </UI.FlexRow>
                </UI.ColumnToRow>
                <UI.FlexRow maxWidth>
                    <UI.ColumnToRow rowCenter>
                        <UI.FlexRow>
                            <UI.RadioLink id="roll-use-glitchy"
                                          type="checkbox" light
                                          checked={glitchy !== 0}
                                          onChange={onGlitchyClicked}>
                                Glitchy
                            </UI.RadioLink>
                            {glitchy !== 0 &&
                                <NumericInput small id="roll-glitchiness"
                                              min={-99} max={99}
                                              placeholder={`${glitchy}`}
                                              onSelect={setRollGlitchy} />
                            }
                        </UI.FlexRow>
                        {glitchy !== 0 &&
                            <RollGlitchyLabel htmlFor="roll-glitchiness">
                                <i>
                                    {glitchy > 0 ? "Reduce " : "Increase "}
                                    number of 1s needed to glitch
                                    by {Math.abs(glitchy)}.
                                </i>
                            </RollGlitchyLabel>
                        }
                    </UI.ColumnToRow>
                </UI.FlexRow>
                <UI.FlexRow spaced floatRight>
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
                                disabled={rollDisabled} bg={rollBackgound}
                                onClick={onRollClicked}>
                        Roll dice
                    </RollButton>
                </UI.FlexRow>
            </form>
        </UI.Card>
    );
}
