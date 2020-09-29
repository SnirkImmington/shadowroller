// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';
import * as UI from 'style';
import NumericInput from 'numeric-input';
import { EventRecord } from 'history-panel';

import * as Game from 'game';
import * as Event from 'event';
import { ConnectionCtx } from 'connection';
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
    const connection = React.useContext(ConnectionCtx);
    const game = React.useContext(Game.Ctx);
    const dispatch = React.useContext(Event.DispatchCtx);

    const [loading, setLoading] = React.useState(false);

    const [base, setBase] = React.useState(0);
    const [title, setTitle] = React.useState("");
    const [dice, setDice] = React.useState(1);
    const [local, setLocal] = React.useState(false);

    const connected = connection === "connected";
    const rollReady = base > 0 && dice > 0 && dice <= 5;

    const event: Event.Initiative = {
        ty: "initiative", id: Date.now().valueOf(),
        source: game?.player ?? "local",
        title: "meatspace", base: 11, dice: [1, 4]
    };

    return (
        <UI.Card color="#81132a">
            <UI.FlexRow maxWidth rowCenter floatRight>
                <UI.CardTitleText color="#81132a">
                    Initiative
                </UI.CardTitleText>
                <UI.LinkButton>[hide]</UI.LinkButton>
            </UI.FlexRow>
            <form id="roll-initiative-form">
                <UI.ColumnToRow>
                    <UI.FlexRow formRow rowCenter>
                        <label htmlFor="roll-initiative-base">
                            Roll
                        </label>
                        <NumericInput id="roll-initiative-base"
                                      min={1} small
                                      onSelect={()=>{}} />
                        +
                        <NumericInput id="roll-initiative-dice"
                                      min={1} max={5} small
                                      onSelect={() =>{}} />
                        <label htmlFor="roll-initiative-dice">
                            d6
                        </label>
                        &nbsp;
                    </UI.FlexRow>
                    <UI.FlexRow maxWidth formRow rowCenter>
                        for
                        <UI.Input expand id="roll-initiative-title"
                                  placeholder="initiative" />
                    </UI.FlexRow>
                </UI.ColumnToRow>
                <UI.FlexRow floatRight spaced rowCenter>
                    <UI.RadioLink id="roll-initiative-in-game"
                                  name="roll-initiative-location"
                                  type="radio" light checked={!local}>
                        in&nbsp;<tt>testgamething</tt>
                    </UI.RadioLink>
                    <UI.RadioLink id="roll-initiative-local"
                                  name="roll-initiative-location"
                                  type="radio" light checked={local}>
                        locally
                    </UI.RadioLink>
                    <RollButton id="roll-initiative-submit" type="submit"
                                bg={RollBackground.inGame}>
                        Roll Initiative
                    </RollButton>
                </UI.FlexRow>
                <EventRecord playerID={game?.player?.id}
                             event={event}
                             setHeight={()=>{}} />
            </form>
        </UI.Card>
    )
}
