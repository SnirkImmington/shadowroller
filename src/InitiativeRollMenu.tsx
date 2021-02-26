import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';
import theme from 'style/theme';
import * as icons from 'style/icon';
import NumericInput from 'NumericInput';

import * as Game from 'game';
import * as Event from 'history/event';
import { ConnectionCtx } from 'connection';
import StatusText from 'connection/StatusText';
import PublicityOptions from 'game/PublicityOptions';
import * as routes from 'routes';
import * as srutil from 'srutil';

const RollBackground = {
    inGame: `linear-gradient(180deg, #783442 0, #601010)`,
    edgy: `linear-gradient(180deg, #ba4864 0, #cc365b)`,
    regular: `linear-gradient(180deg, #394341 0, #232928)`
}

const RollButton = styled.button<{bg: string}>`
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
export default function RollInitiativePrompt() {
    const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const gameExists = Boolean(game);
    const dispatch = React.useContext(Event.DispatchCtx);

    const [shown, toggleShown] = srutil.useToggle(true);
    const [loading, setLoading] = React.useState(false);
    const [localRoll, toggleLocalRoll, setLocalRoll] = srutil.useToggle(!game);
    React.useEffect(() =>
        setLocalRoll(!gameExists),
        [gameExists, setLocalRoll]
    );

    const [base, setBase] = React.useState<number|null>();
    const [baseText, setBaseText] = React.useState("");
    const [title, setTitle] = React.useState("");
    const [dice, setDice] = React.useState(1);
    const [diceText, setDiceText] = React.useState("");

    const connected = connection === "connected";
    const rollDisabled = (
        !dice || dice < 0 || dice > 5
        || !base || base < 0 || base > 50
        || loading || (game && !localRoll && !connected)
    );

    const titleChanged = React.useCallback((e) => {
        setTitle(e.target.value); }, [setTitle]);
    const baseChanged = React.useCallback((value: number | null) => {
        setBase(value); }, [setBase]);
    const diceChanged = React.useCallback((value: number | null) => {
        setDice(value || 1); }, [setDice]);

    const rollClicked = React.useCallback((e) => {
        e.preventDefault();
        if (rollDisabled) {
            return;
        }

        if (localRoll) {
            const initiativeDice = srutil.roll(dice);
            const event: Event.Initiative = {
                ty: "initiativeRoll", id: Event.newID(), source: "local",
                base: base || 0, dice: initiativeDice, title
            };

            dispatch({ ty: "newEvent", event });
        }
        else {
            setLoading(true);
            routes.game.rollInitiative({ base: base || 0, dice, title })
                .onDone((res, full) => {
                    setLoading(false);
                    if (!res && process.env.NODE_ENV !== "production") {
                        console.error("Error rolling initiative:", full);
                    }
                })
        }
    }, [rollDisabled, localRoll, base, dice, title, dispatch]);

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
            <form id="roll-initiative-form">
                <UI.ColumnToRow formRow>
                    <UI.FlexRow formRow>
                        <label htmlFor="roll-initiative-base">
                            Roll
                        </label>
                        <NumericInput small id="roll-initiative-base"
                                      min={0} max={69}
                                      text={baseText} setText={setBaseText}
                                      onSelect={baseChanged} />
                        +
                        <NumericInput small id="roll-initiative-dice"
                                      min={1} max={5} placeholder="1"
                                      text={diceText} setText={setDiceText}
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
                </UI.ColumnToRow>
                <UI.FlexRow spaced floatRight>
                    {game &&
                        <PublicityOptions prefix="roll-initiative"
                                          state="inGame" onChange={function() {}} />}
                    <UI.FlexRow spaced>
                        {!connected && <StatusText connection={connection} />}
                        <RollButton id="roll-initiative-submit" type="submit"
                                    bg={RollBackground.inGame}
                                    disabled={Boolean(rollDisabled)} onClick={rollClicked}>
                            Roll Initiative
                        </RollButton>
                    </UI.FlexRow>
                </UI.FlexRow>
            </form>
        </UI.Card>
    );
}
