// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import NumericInput from 'numeric-input';

import * as Game from 'game';
import * as Event from 'history/event';
import { ConnectionCtx } from 'connection';
import StatusText from 'connection/StatusText';
import routes from 'routes';
import * as srutil from 'srutil';
import theme from 'style/theme';
import * as icons from 'style/icon';

export const ROLL_TITLE_FLAVOR: string[] = [
    "swipe the key card",
    "negotiate for more pay",

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
    "avoid looking at the explosion",

    "gamble on the virtual horse racing",
    "backflip out of the plane",
    "pilot my drone under the door",
    "repair the juggernaut",
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
    "look at the vampire",

    "drive through the storm",
    "win the bike race",
    "identify the gang",
    "play the guitar",
    "run from the bear",
    "find the bandit",
    "jump through the air duct",
    "fireball the door",
    "pretend to be a chef",
    "smuggle in handcuffs",
    "remember the cocktail list",
    "practice blood magic",

    "slice with zappy sword",
    "throw the deck",
    "swipe George's ID card",
    "pretend to be George",
    "shoot down the bugs",
    "inspire the intern",
    "wave a sword cane helpfully",
    "summon the zeppelin",
];

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
    /* Mobile: full width - "name rolls to" */

    /* Desktop: need to shrink for push the limit button */
    @media all and (min-width: 768px) {
        /* flex-shrink: 1; */
    }*/
`;

const RollGlitchyLabel = styled.label`
    padding: .5em;
    @media all and (min-width: 768px) {
        padding: 0;
    }
`;

const FullWidthSpacing = styled.span`
    @media all and (min-width: 768px) {
        flex-grow: 1;
    }
`;

export default function RollDicePrompt() {
    const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const gameExists = Boolean(game);
    const dispatch = React.useContext(Event.DispatchCtx);

    const [shown, toggleShown] = srutil.useToggle(true);
    const [rollLoading, setRollLoading] = React.useState(false);
    const [titleFlavor, newTitleFlavor] = srutil.useFlavor(ROLL_TITLE_FLAVOR);
    const [localRoll, toggleLocalRoll, setLocalRoll] = srutil.useToggle(!game);
    React.useEffect(() =>
        setLocalRoll(!gameExists),
        [gameExists, setLocalRoll]
    );

    const [diceText, setDiceText] = React.useState("");
    const [diceCount, setDiceCount] = React.useState<?number>(null);
    const [title, setTitle] = React.useState("");
    const [edge, setEdge] = React.useState(false);
    const [glitchy, setGlitchy] = React.useState(0);

    const connected = connection === "connected";
    const rollDisabled = (
        !diceCount || diceCount < 1 || diceCount > 100
        || rollLoading || (game && !localRoll && !connected)
    );

    const rollBackgound = connected && !localRoll ?
        (edge ? RollBackground.edgy : RollBackground.inGame)
        : RollBackground.regular;

    function rollTitleChanged(event: SyntheticInputEvent<HTMLInputElement>) {
        setTitle(event.target.value || '');
    }

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
        if (rollDisabled || !diceCount) {
            return;
        }

        if (localRoll) {
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
                        console.error("Error rolling:", full);
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

    if (!shown) {
        return (
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>
                    <UI.FAIcon icon={icons.faDice} />
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
                <UI.CardTitleText color={theme.colors.primary}>
            {/*<AnimatedDie unpadded color={theme.colors.primary} />*/}
                    <UI.FAIcon icon={icons.faDice} />
                    Roll Dice
                </UI.CardTitleText>
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
                        <NumericInput id="roll-select-dice"
                                      min={1} max={99}
                                      text={diceText}
                                      setText={setDiceText}
                                      value={diceCount}
                                      onSelect={setDiceCount} />
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
                    <FullWidthSpacing />
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
                    {game && <>
                        <UI.RadioLink id="roll-set-in-game"
                                      name="roll-location"
                                      type="radio" light
                                      checked={!localRoll}
                                      onChange={toggleLocalRoll}>
                            in {game.gameID}
                        </UI.RadioLink>
                        <UI.RadioLink id="roll-set-local"
                                      name="roll-location"
                                      type="radio" light
                                      checked={localRoll}
                                      onChange={toggleLocalRoll}>
                            locally
                        </UI.RadioLink>
                    </>}
                    <UI.FlexRow spaced>
                        {!connected && <StatusText connection={connection} />}
                        <RollButton id="roll-button-submit" type="submit"
                                    disabled={rollDisabled} bg={rollBackgound}
                                    onClick={onRollClicked}>
                            Roll dice
                        </RollButton>
                    </UI.FlexRow>
                </UI.FlexRow>
            </form>
        </UI.Card>
    );
}
