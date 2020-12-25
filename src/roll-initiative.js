// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import NumericInput from 'numeric-input';

import * as Game from 'game';
import * as Event from 'history/event';
//import { ConnectionCtx } from 'connection';
import routes from 'routes';
import * as srutil from 'srutil';

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
export default function RollInitiativePrompt() {
    //const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const dispatch = React.useContext(Event.DispatchCtx);

    const [shown, setShown] = React.useState(true);
    //const [loading, setLoading] = React.useState(false);

    const [base, setBase] = React.useState<?number>();
    const [title, setTitle] = React.useState("");
    const [dice, setDice] = React.useState<number>(1);
    //const [local, setLocal] = React.useState(false);
    const local = game?.gameID == null;


    //const connected = connection === "connected";
    const rollReady = base && dice && base > 0 && dice > 0 && dice <= 5;

    const titleChanged = React.useCallback((e) => { setTitle(e.target.value); }, [setTitle]);
    const baseChanged = React.useCallback((value) => { setBase(value); }, [setBase]);
    const diceChanged = React.useCallback((value) => { setDice(value || 1); }, [setDice]);

    const rollClicked = React.useCallback((e) => {
        e.preventDefault();
        if (!rollReady) { return; }

        if (local) {
            const initiativeDice = srutil.roll(dice);
            const event: Event.Initiative = {
                ty: "initiativeRoll", id: Event.newID(), source: "local",
                base: base || 0, dice: initiativeDice, title
            };

            dispatch({ ty: "newEvent", event });
        }
        else {
            routes.game.rollInitiative({ base: base || 0, dice, title });
        }
    }, [rollReady, dispatch, local, base, dice, title]);

    if (!shown) {
        return (
                <UI.FlexRow maxWidth rowCenter floatRight>
                    <UI.CardTitleText color="#81132a">
                        Initiative
                    </UI.CardTitleText>
                    <UI.LinkButton minor onClick={() => setShown(true)}>
                        show
                    </UI.LinkButton>
                </UI.FlexRow>
        );
    }
    return (
        <UI.Card color="#81132a">
            <UI.FlexRow maxWidth rowCenter floatRight>
                <UI.CardTitleText color="#81132a">
                    Initiative
                </UI.CardTitleText>
                <UI.LinkButton minor onClick={() => setShown(false)}>
                    hide
                </UI.LinkButton>
            </UI.FlexRow>
            <form id="roll-initiative-form">
                <UI.ColumnToRow>
                    <UI.FlexRow formRow rowCenter>
                        <label htmlFor="roll-initiative-base">
                            Roll
                        </label>
                        <NumericInput small id="roll-initiative-base"
                                      min={1}
                                      onSelect={baseChanged} />
                        +
                        <NumericInput small id="roll-initiative-dice"
                                      min={1} max={5} placeholder="1"
                                      onSelect={diceChanged} />
                        <label htmlFor="roll-initiative-dice">
                            d6
                        </label>
                        &nbsp;
                    </UI.FlexRow>
                    <UI.FlexRow maxWidth formRow rowCenter>
                        for
                        <UI.Input expand id="roll-initiative-title"
                                  placeholder="initiative"
                                  onChange={titleChanged}
                                  value={title} />
                    </UI.FlexRow>
                </UI.ColumnToRow>
                <UI.FlexRow floatRight spaced rowCenter>
                    <RollButton id="roll-initiative-submit" type="submit"
                                bg={RollBackground.inGame}
                                disabled={!rollReady} onClick={rollClicked}>
                        Roll Initiative
                    </RollButton>
                </UI.FlexRow>
            </form>
        </UI.Card>
    );
}
