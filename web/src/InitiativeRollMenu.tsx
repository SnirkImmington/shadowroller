import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';
import * as icons from 'style/icon';
import NumericInput from 'NumericInput';

import * as Game from 'game';
import * as Event from 'event';
import * as Share from 'share';
import { ConnectionCtx } from 'connection';
import StatusText from 'connection/StatusText';
import ShareOptions from 'share/Options';
import * as routes from 'routes';
import * as srutil from 'srutil';

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

    &:hover {
        text-decoration: none;
    }

    &:active {
        filter: brightness(85%);
    }

    &[disabled] {
        cursor: not-allowed;
        color: #ccc;
        filter: saturate(40%) brightness(85%);
    }
`;
export default function RollInitiativePrompt() {
    const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const gameExists = Boolean(game);
    const dispatch = React.useContext(Event.DispatchCtx);

    const [shown, toggleShown] = srutil.useToggle(true);
    const [loading, setLoading] = React.useState(false);
    const [share, setShare] = React.useState<Share.Mode>(Share.InGame);

    const [base, setBase] = React.useState<number|null>();
    const [baseText, setBaseText] = React.useState("");
    const [title, setTitle] = React.useState("");
    const [dice, setDice] = React.useState<number>(1);
    const [diceText, setDiceText] = React.useState("");
    const [blitzed, setBlitzed] = React.useState(false);
    const [seized, setSeized] = React.useState(false)

    const connected = connection === "connected";
    const rollDisabled = (
        dice < 1 || dice > 5
        || base == null || base < -2 || base > 69
        || loading || (gameExists && !connected)
    );

    const titleChanged = React.useCallback((e) => {
        setTitle(e.target.value);
    }, [setTitle]);
    const baseChanged = React.useCallback((value: number | null) => {
        setBase((prev) => value ?? prev);
    }, [setBase]);
    const diceChanged = React.useCallback((value: number | null) => {
        setDice((prev) => value ?? prev);
    }, [setDice]);
    const blitzedChanged = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.checked;
        if (value) {
            setSeized(false);
        }
        setBlitzed(value);
    }, [setBlitzed, setSeized]);
    const seizedChanged = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.checked;
        if (value) {
            setBlitzed(false);
        }
        setSeized(value);
    }, [setSeized, setBlitzed]);

    const rollClicked = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (rollDisabled) {
            return;
        }

        if (!gameExists) {
            const initiativeDice = srutil.roll(blitzed ? 5 : dice);
            const event: Event.Initiative = {
                ty: "initiativeRoll", id: Event.newID(), source: "local",
                base: base ?? 0, dice: initiativeDice, title, seized, blitzed,
            };

            dispatch({ ty: "newEvent", event });
        }
        else {
            setLoading(true);
            routes.game.rollInitiative({
                base: base ?? 0, dice: blitzed ? 5 : dice, title, share, seized, blitzed,
            }).onDone((res, full) => {
                setLoading(false);
                if (!res && process.env.NODE_ENV !== "production") {
                    console.error("Error rolling initiative:", full);
                }
            });
        }
    }, [rollDisabled, gameExists, base, dice, title, seized, blitzed, dispatch]);

    if (!shown) {
        return (
                <UI.FlexRow maxWidth floatRight>
                    <UI.CardTitleText color={theme.colors.primary}>
                        <UI.FAIcon icon={icons.faClipboardList} />
                        Initiative
                    </UI.CardTitleText>
                    <UI.LinkButton minor onClick={toggleShown}>
                        show
                    </UI.LinkButton>
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
                <UI.LinkButton minor onClick={toggleShown}>
                    hide
                </UI.LinkButton>
            </UI.FlexRow>
            <form id="roll-initiative">
                <UI.ColumnToRow formRow>
                    <UI.FlexRow formRow>
                        <label htmlFor="roll-initiative-base">
                            Roll
                        </label>
                        <NumericInput small id="roll-initiative-base"
                                      min={-2} max={69}
                                      text={baseText} setText={setBaseText}
                                      onSelect={baseChanged} />
                        +
                        <NumericInput small id="roll-initiative-dice"
                                      min={1} max={5} placeholder="1"
                                      text={blitzed ? "5" : diceText} setText={setDiceText}
                                      disabled={blitzed}
                                      onSelect={diceChanged} />
                        <label htmlFor="roll-initiative-dice">
                            d6
                        </label>
                        &nbsp;
                    </UI.FlexRow>
                    <UI.FlexRow maxWidth formRow>
                        for
                        <UI.Input expand id="roll-initiative-title"
                                  placeholder="initiative"
                                  onChange={titleChanged}
                                  value={title} />
                    </UI.FlexRow>
                    <UI.FlexRow formRow formSpaced>
                        <UI.RadioLink id="roll-initiative-blitz" type="checkbox" light
                                      checked={blitzed} onChange={blitzedChanged}>
                            Blitz
                        </UI.RadioLink>
                        <UI.RadioLink id="roll-initiative-seize-the-initiative" type="checkbox" light
                                      checked={seized} onChange={seizedChanged}>
                            Seize the initiative
                        </UI.RadioLink>
                    </UI.FlexRow>
                </UI.ColumnToRow>
                <UI.FlexRow spaced floatRight>
                    {gameExists &&
                        <ShareOptions prefix="roll-initiative"
                                          state={share} onChange={setShare} />}
                    <UI.FlexRow spaced>
                        {!connected && <StatusText connection={connection} />}
                        <RollButton id="roll-initiative-submit" type="submit"
                                    bg={RollBackground.inGame}
                                    disabled={Boolean(rollDisabled)} onClick={rollClicked}>
                            {gameExists && share !== Share.InGame &&
                                <UI.FAIcon icon={Share.icon(share)}
                                           transform="grow-4" />}
                            Initiative
                        </RollButton>
                    </UI.FlexRow>
                </UI.FlexRow>
            </form>
        </UI.Card>
    );
}
