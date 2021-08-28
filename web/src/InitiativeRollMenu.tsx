import * as React from 'react';
import styled, { ThemeContext } from 'styled-components/macro';
import * as UI from 'style';
import * as Button from 'component/Button';
import * as icons from 'style/icon';
import NumericInput from 'component/NumericInput';
import { Toggle as ToggleProps } from 'component/props';
import * as Space from 'component/Space';
import Radiobox from 'component/Radiobox';
import Checkbox from 'component/Checkbox';

import * as Game from 'game';
import * as Event from 'event';
import * as Player from 'player';
import * as Share from 'share';
import { ConnectionCtx } from 'connection';
import StatusText from 'connection/StatusText';
import ShareOptions from 'share/Options';
import * as routes from 'routes';
import * as roll from 'roll';
import * as srutil from 'srutil';
import * as colorUtil from 'colorUtil';

const RollBackground = {
    inGame: `linear-gradient(180deg, #783442 0, #601010)`,
    edgy: `linear-gradient(180deg, #ba4864 0, #cc365b)`,
    regular: `linear-gradient(180deg, #394341 0, #232928)`
};

const RollButton = styled.button<{bg: string}>`
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
        filter: brightness(85%);
    }

    &:disabled {
        cursor: not-allowed;
        color: #ccc;
        filter: saturate(40%) brightness(85%);
    }
`;

type DiceInputPrompts = {
    onBaseSelect: (value: number | null) => void,
    baseText: string,
    setBaseText: srutil.Setter<string>,

    blitzed: boolean,
    onDiceSelect: (value: number | null) => void,
    diceText: string,
    setDiceText: srutil.Setter<string>,
}

function DiceInput(props: DiceInputPrompts) {
    const {
        onBaseSelect, baseText, setBaseText,
        blitzed, onDiceSelect, diceText, setDiceText,
    } = props;
    return (
        <UI.FlexRow formRow>
            <label htmlFor="roll-initiative-base">
                Roll
            </label>
            <NumericInput small id="roll-initiative-base"
                          min={-2} max={69}
                          text={baseText} setText={setBaseText}
                          onSelect={onBaseSelect} />
            +
            <NumericInput small id="roll-initiative-dice"
                          min={1} max={5} placeholder="1"
                          text={blitzed ? "5" : diceText} setText={setDiceText}
                          disabled={blitzed}
                          onSelect={onDiceSelect} />
            <label htmlFor="roll-initiative-dice">
                d6
            </label>
            &nbsp;
        </UI.FlexRow>
    );
}

const StyledMessageInput = styled(UI.Input)({
    maxWidth: "10.89em"
});

type MessageProps = {
    title: string,
    setTitle: srutil.Setter<string>,
}

function MessageInput(props: MessageProps) {
    const { title, setTitle } = props;
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
    }, [setTitle]);
    return (
        <UI.FlexRow formRow>
            <label htmlFor="roll-initiative-title">
            for
            </label>
            <StyledMessageInput id="roll-initiative-title"
                                placeholder="initiative"
                                onChange={onChange}
                                value={title} />
        </UI.FlexRow>
    );
}

function BlitzToggle(props: ToggleProps) {
    const { checked, setChecked, color } = props;
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setChecked(e.target.checked);
        }, [setChecked]);
    return (
            <Checkbox id="roll-initiative-blitz"
                      checked={checked} onChange={onChange}>
                <UI.TextWithIcon color={color}>
                    <UI.FAIcon transform="grow-2" className="icon-inline" icon={icons.faBolt} />
                    Blitz
                </UI.TextWithIcon>
            </Checkbox>
    );
}

function SeizeToggle(props: ToggleProps) {
    const { checked, setChecked, color } = props;
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setChecked(e.target.checked);
        }, [setChecked]);
    return (
        <Checkbox id="roll-initiative-seize-the-initiative"
                      checked={checked} onChange={onChange}>
            <UI.TextWithIcon color={color}>
                <UI.FAIcon transform="grow-2" className="icon-inline" icon={icons.faSortAmountUp} />
                Seize the initiative
            </UI.TextWithIcon>
        </Checkbox>
    );
}

export default function RollInitiativePrompt() {
    const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const gameExists = Boolean(game);
    const dispatch = React.useContext(Event.DispatchCtx);
    const player = React.useContext(Player.Ctx);
    const theme = React.useContext(ThemeContext);

    const [shown, toggleShown] = srutil.useToggle(true);
    const [loading, setLoading] = React.useState(false);
    const [share, setShare] = React.useState<Share.Mode>(Share.Mode.InGame);

    const [base, setBase] = React.useState<number|null>();
    const [baseText, setBaseText] = React.useState("");
    const [title, setTitle] = React.useState("");
    const [dice, setDice] = React.useState<number|null>(1);
    const [diceText, setDiceText] = React.useState("");
    const [blitzed, setBlitzed] = React.useState(false);
    const [seized, setSeized] = React.useState(false);

    const exclusiveSetSeized = React.useCallback((value) => {
        if (value) {
            setBlitzed(false);
        }
        setSeized(value);
    }, [setBlitzed, setSeized]);

    const exclusiveSetBlitzed = React.useCallback((value) => {
        if (value) {
            setSeized(false);
        }
        setBlitzed(value);
    }, [setSeized, setBlitzed]);

    const connected = connection === "connected";
    const rollDisabled = (
        dice == null || dice < 1 || dice > 5
        || base == null || base < -2 || base > 69
        || loading || (gameExists && !connected)
    );
    const color = colorUtil.playerColor(player?.hue, theme);

    const onSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (rollDisabled) {
            return;
        }

        if (!gameExists) {
            const initiativeDice = roll.dice(blitzed ? 5 : dice!);
            const event: Event.Initiative = {
                ty: "initiativeRoll", id: Event.newID(), source: "local",
                base: base ?? 0, dice: initiativeDice, title, seized, blitzed,
            };

            dispatch({ ty: "newEvent", event });
        }
        else {
            setLoading(true);
            routes.game.rollInitiative({
                base: base ?? 0, dice: blitzed ? 5 : dice!, title, share, seized, blitzed,
            }).onDone((res, full) => {
                setLoading(false);
                if (!res && process.env.NODE_ENV !== "production") {
                    console.error("Error rolling initiative:", full);
                }
            });
        }
    }, [rollDisabled, gameExists, base, dice, title, share, seized, blitzed, dispatch]);

    if (!shown) {
        return (
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>
                    <UI.FAIcon icon={icons.faClipboardList} />
                    Initiative
                </UI.CardTitleText>
                <Button.Minor onClick={toggleShown}>
                    show
                </Button.Minor>
            </UI.FlexRow>
        );
    }

    return (
        <UI.Card color={theme.colors.primary}>
            <UI.FlexRow maxWidth floatRight>
                <UI.CardTitleText color={theme.colors.primary}>
                    <UI.FAIcon icon={icons.faClipboardList} />
                    Initiative
                </UI.CardTitleText>
                <Button.Minor onClick={toggleShown}>
                    hide
                </Button.Minor>
            </UI.FlexRow>
            <form id="roll-initiative" onSubmit={onSubmit}>
                <UI.FlexRow formRow flexWrap>
                    <DiceInput baseText={baseText} setBaseText={setBaseText}
                               onBaseSelect={setBase} blitzed={blitzed}
                               diceText={diceText} setDiceText={setDiceText}
                               onDiceSelect={setDice} />
                    <MessageInput title={title} setTitle={setTitle} />
                    <Space.FlexGrow />
                    <UI.FlexRow formSpaced formRow flexWrap>
                        <BlitzToggle checked={blitzed} setChecked={exclusiveSetBlitzed}
                                     color={color} />
                        <SeizeToggle checked={seized} setChecked={exclusiveSetSeized}
                                     color={color} />
                    </UI.FlexRow>
                </UI.FlexRow>
                <UI.FlexRow maxWidth formRow flexWrap>
                    {gameExists &&
                        <ShareOptions prefix="roll-initiative"
                                          state={share} onChange={setShare} />}
                    <Space.FlexGrow />
                    <UI.FlexRow flexGrow spaced>
                        <Space.FlexGrow />
                        {!connected &&
                            <StatusText connection={connection} />}
                        {gameExists && share !== Share.Mode.InGame &&
                            <UI.FAIcon color={theme.colors.highlight} icon={Share.icon(share)} className="icon-roll" transform="grow-4" />}
                        <RollButton id="roll-initiative-submit" type="submit"
                                    bg={RollBackground.inGame}
                                    disabled={Boolean(rollDisabled)}>
                            Initiative
                        </RollButton>
                    </UI.FlexRow>
                </UI.FlexRow>
            </form>
        </UI.Card>
    );
}
