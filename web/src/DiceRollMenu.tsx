import * as React from 'react';
import styled, { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as Button from 'component/Button';
import StatusText from 'connection/StatusText';
import ShareOptions from 'share/Options';
import NumericInput from 'component/NumericInput';
import type { Selector, InvalidState } from 'component/NumericInput';
import type { Colorable, Toggle as ToggleProps } from 'component/props';
import * as Space from 'component/Space';
import * as layout from 'layout';

import * as Event from 'event';
import * as Game from 'game';
import * as Player from 'player';
import * as Share from 'share';
import { ConnectionCtx } from 'connection';
import * as routes from 'routes';
import * as roll from 'roll';
import * as srutil from 'srutil';
import * as colorUtil from 'colorUtil';
import * as icons from 'style/icon';

export const ROLL_TITLE_FLAVOR: string[] = [
    "swipe the key card",
    "negotiate for more pay",

    "avoid the oncoming shrapnel",
    "duck out of the way",

    "recover from last night",
    "geek the mage",
    "not freak out",
    "sneak past the guards",
    "fib to the cops",
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

    "gamble on the horse racing",
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
    "hack the cupcake",
    "catch the hacker",
    "look at the vampire",
    "embrace the Matrix",
    "identify medical equipment",

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
    "practice blood magic",
    "bike the guantlet",

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
};

const RollButton = styled.button<{ bg: string }>`
    font-size: 1.07em;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    padding: .3rem .7rem;
    border: 0;

    color: white;
    background-image: ${props => props.bg};

    & > *:first-child {
        margin-right: 0.5rem;
    }

    &:enabled:hover {
        text-decoration: none;
        filter: brightness(90%);
    }

    &:enabled:active {
        filter: brightness(80%);
    }

    &:disabled {
        cursor: not-allowed;
        color: #ccc;
        filter: saturate(40%) brightness(85%);
    }
`;

type InputProps = {
    onSelect: Selector,
    text: string,
    setText: srutil.Setter<string>,
}

function RollDiceInput({ onSelect, text, setText }: InputProps) {
    return (
        <UI.FlexRow formRow>
            <label htmlFor="roll-select-dice">
                Roll
            </label>
            <NumericInput id="roll-select-dice"
                          min={1} max={99}
                          onSelect={onSelect}
                          text={text} setText={setText} />
            <span>dice</span>
            &nbsp;
        </UI.FlexRow>
    );
}

type TitleProps = {
    title: string,
    setTitle: srutil.Setter<string>,
    flavor: string,
}

function RollTitleInput({ title, setTitle, flavor }: TitleProps) {
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
    }, [setTitle]);

    return (
        <UI.FlexRow formRow>
            <label htmlFor="roll-title">
                to
            </label>
            <UI.Input id="roll-title" expand
                      placeholder={flavor}
                      onChange={onChange}
                      value={title} />
        </UI.FlexRow>
    )
}

function PushLimitInput({ checked, setChecked, color }: ToggleProps) {
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setChecked(e.target.checked);
    }, [setChecked]);

    return (
        <UI.FlexRow formRow>
        <UI.RadioLink id="roll-enable-edge"
                      type="checkbox" light
                      checked={checked}
                      onChange={onChange}>
            <UI.TextWithIcon color={color}>
                <UI.FAIcon transform="grow-2" className="icon-inline"
                           icon={icons.faBolt} />
                Push the limit
            </UI.TextWithIcon>
        </UI.RadioLink>
        </UI.FlexRow>
    );
}

const GlitchyExplainLabel = styled.label({
    padding: layout.Space.Small
});

type GlitchyToggleProps = Colorable & {
    glitchy: number,
    setGlitchy: srutil.Setter<number>,
    onGlitchySelect: Selector,
}

function GlitchyInput(props: GlitchyToggleProps) {
    const { color, glitchy, setGlitchy, onGlitchySelect } = props;
    const onEnableChange = React.useCallback(
        (_e: React.ChangeEvent<HTMLInputElement>) => {
            setGlitchy(g => g === 0 ? 1 : 0);
    }, [setGlitchy]);
    return (
        <UI.FlexRow inputRow maxWidth flexWrap>
            <UI.RadioLink id="roll-use-glitchy"
                          type="checkbox" light
                          checked={glitchy !== 0}
                          onChange={onEnableChange}>
                <UI.TextWithIcon color={color}>
                    <UI.FAIcon transform="grow-1" className="icon-inline"
                               icon={icons.faSkullCrossbones} />
                    Glitchy
                </UI.TextWithIcon>
            </UI.RadioLink>
            {props.glitchy !== 0 &&
                <NumericInput small id="roll-glitchiness"
                              min={-99} max={99}
                              placeholder={`${props.glitchy}`}
                              onSelect={onGlitchySelect} />
            }
            {props.glitchy !== 0 &&
                <GlitchyExplainLabel htmlFor="roll-glitchiness">
                        {props.glitchy > 0 ? "Reduce " : "Increase "}
                        number of 1s needed to glitch
                        by {Math.abs(props.glitchy)}.
                </GlitchyExplainLabel>
            }
        </UI.FlexRow>
    );
}

export default function RollDicePrompt() {
    const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const player = React.useContext(Player.Ctx);
    const gameExists = Boolean(game);
    const dispatch = React.useContext(Event.DispatchCtx);
    const theme = React.useContext(ThemeContext);
    const color = colorUtil.playerColor(player?.hue, theme);

    const [shown, toggleShown] = srutil.useToggle(true);
    const [rollLoading, setRollLoading] = React.useState(false);
    const [titleFlavor, newTitleFlavor] = srutil.useFlavor(ROLL_TITLE_FLAVOR);
    const [share, setShare] = React.useState<Share.Mode>(Share.Mode.InGame);

    const [diceText, setDiceText] = React.useState("");
    const [diceCount, setDiceCount] = React.useState<number | InvalidState>("empty");
    const [title, setTitle] = React.useState("");
    const [edge, setEdge] = React.useState(false);
    const [glitchy, setGlitchy] = React.useState(0);

    const connected = connection === "connected";
    const rollDisabled = (
        (typeof diceCount !== "number") || diceCount < 1 || diceCount > 100
        || rollLoading || (gameExists && !connected)
    );

    const rollBackgound = edge ? RollBackground.edgy : RollBackground.inGame;

    const setRollGlitchy = React.useCallback(
        (g: number | InvalidState) => (typeof g === "number") && setGlitchy(g),
        [setGlitchy]
    );

    function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (rollDisabled || typeof diceCount !== "number") {
            return;
        }

        if (!gameExists) {
            let localRoll: Event.Event;
            if (edge) {
                const rounds = roll.explodingSixes(diceCount);
                localRoll = {
                    ty: "edgeRoll", source: "local", id: Event.newID(),
                    title, rounds, glitchy,
                };
            }
            else {
                const dice = roll.dice(diceCount);
                localRoll = {
                    ty: "roll", source: "local", id: Event.newID(),
                    title, dice, glitchy,
                };
            }
            dispatch({ ty: "newEvent", event: localRoll });
        }
        else {
            setRollLoading(true);
            routes.game.roll({ count: diceCount, title, share, edge, glitchy })
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
                <Button.Minor onClick={toggleShown}>
                    show
                </Button.Minor>
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
                <Button.Minor onClick={toggleShown}>
                    hide
                </Button.Minor>
            </UI.FlexRow>
            <form id="dice-input" onSubmit={onSubmit}>
                <UI.FlexRow maxWidth flexWrap>
                    <RollDiceInput onSelect={setDiceCount}
                                   text={diceText} setText={setDiceText} />
                    <RollTitleInput title={title} setTitle={setTitle}
                                    flavor={titleFlavor} />
                    <Space.FlexGrow />
                    <PushLimitInput checked={edge} setChecked={setEdge}
                                    color={color} />
                </UI.FlexRow>
                <UI.FlexRow formRow maxWidth>
                    <GlitchyInput glitchy={glitchy} setGlitchy={setGlitchy}
                                  onGlitchySelect={setRollGlitchy} color={color} />
                </UI.FlexRow>
                <UI.FlexRow formRow maxWidth flexWrap>
                    {gameExists &&
                        <ShareOptions prefix="roll-dice"
                                      state={share} onChange={setShare} />}
                    <Space.FlexGrow />
                    <UI.FlexRow flexGrow spaced>
                        <Space.FlexGrow />
                        {!connected &&
                            <StatusText connection={connection} />}
                        {gameExists && share !== Share.Mode.InGame &&
                            <UI.FAIcon color={theme.colors.highlight} icon={Share.icon(share)}
                                transform="grow-4" className="icon-roll" />}
                        <RollButton id="roll-button-submit" type="submit"
                                    disabled={rollDisabled} bg={rollBackgound}>
                            Roll dice
                        </RollButton>
                    </UI.FlexRow>
                </UI.FlexRow>
            </form>
        </UI.Card>
    );
}
