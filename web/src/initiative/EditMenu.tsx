import * as React from 'react';
import styled from 'styled-components/macro';

import * as UI from 'style';
import * as icons from 'style/icon';
import * as Space from 'component/Space';
import * as layout from 'layout';

import * as Event from 'event';
import * as rollStats from 'roll/stats';

import IconCheckbox from 'component/IconCheckbox';
import NumericInput from 'component/NumericInput';

import type { Setter, SetterBase } from 'srutil';
import type { Colorable, HasID, Disableable, Toggle as ToggleProps } from 'component/props';

type AmountProps = HasID & {
    dice: number|null,
    setDice: Setter<number|null>,
    base: number|null,
    setBase: Setter<number|null>,
}

function AmountsInput(props: AmountProps) {
    const { id, base, setBase, dice, setDice } = props;
    const [baseText, setBaseText] = React.useState(base?.toString() ?? "");
    const [diceText, setDiceText] = React.useState(dice?.toString() ?? "");

    const baseID = `${id}-select-base`;
    const diceID = `${id}-select-dice`;

    return (
        <UI.FlexRow formRow>
            <label htmlFor={baseID}>
                Roll
            </label>
            <NumericInput id={baseID} min={-10} max={69} small
                          value={base} onSelect={setBase}
                          text={baseText} setText={setBaseText} />
            +
            <NumericInput id={diceID} min={0} max={5} small
                          value={dice} onSelect={setDice}
                          text={diceText} setText={setDiceText} />
            <label htmlFor={diceID}>
                d6
            </label>
            &nbsp;
        </UI.FlexRow>
    );
}

const StyledTitleInput = styled(UI.Input)({
    maxWidth: "10.69em"
});

type TitleProps = HasID & {
    title: string,
    setTitle: Setter<string>,
}

function TitleInput(props: TitleProps) {
    const { id, title, setTitle } = props;
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value)
        },
        [setTitle]
    );
    const formID = `${id}-title`;

    return (
        <UI.FlexRow formRow>
            <label htmlFor={formID}>
                for
            </label>
            <StyledTitleInput id={formID} expand
                              value={title} onChange={onChange} />
        </UI.FlexRow>
    );
}

type Props = HasID & Colorable & {
    editing: boolean,
    loading: boolean,
    setLoading: Setter<Boolean>,
    event: Event.Initiative,
    onEdit: (event: Event.Initiative) => void,
    onSubmit: () => void,
}

export default function EditMenu(props: Props) {
    const cmdDispatch = React.useContext(Event.CmdCtx);
    const { id, color, editing, loading, setLoading, event, onEdit, onSubmit } = props;

    const [title, setTitle] = React.useState(event.title);
    const [base, setBase] = React.useState<number|null>(event.base);
    const [diceCount, setDiceCount] = React.useState<number|null>(event.dice.length);
    const [seized, setSeized] = React.useState(event.seized);
    const [blitzed, setBlitzed] = React.useState(event.blitzed); // TODO

    const edgeActionsDisabled = event.blitzed || event.seized;
    const diceDiff = (diceCount || event.dice.length) - event.dice.length;

    return (
        <UI.FlexColumn>
            <UI.FlexRow maxWidth flexWrap>
                <AmountsInput id={id} base={base} setBase={setBase}
                              dice={diceCount} setDice={setDiceCount} />
                <TitleInput id={id} title={title} setTitle={setTitle} />
                <Space.FlexGrow />
                <UI.FlexRow formSpaced>
                <IconCheckbox icon={icons.faBolt}
                              checked={blitzed} setChecked={setBlitzed}
                              color={color} id={`{id}-set-blitz`}
                              disabled={edgeActionsDisabled}>
                    Blitz
                </IconCheckbox>
                <IconCheckbox icon={icons.faSortAmountUp}
                              checked={seized} setChecked={setSeized}
                              color={color} id={`${id}-set-seize-the-initiative`}
                              disabled={edgeActionsDisabled}>
                    Seize the initiative
                </IconCheckbox>
                </UI.FlexRow>
            </UI.FlexRow>
            <UI.FlexRow formRow maxWidth>
                <Space.FlexGrow />
                Submit
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}
