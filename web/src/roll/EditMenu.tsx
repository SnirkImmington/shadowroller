import * as React from 'react';
import styled from 'styled-components/macro';

import * as UI from 'style';
import * as icons from 'style/icon';
import * as Space from 'component/Space';
import * as layout from 'layout';

import * as Event from 'event';
import * as rollStats from 'roll/stats';

import NumericInput from 'component/NumericInput';

import type { Setter, SetterBase } from 'srutil';
import type { Colorable, HasID, Disableable, Toggle as ToggleProps } from 'component/props';

type DiceInputProps = HasID & {
    value: number | null,
    onSelect: (value: number | null) => void,
    text: string,
    setText: Setter<string>,
}

/** RollDiceInput renders the dice amount selector */
function RollDiceInput(props: DiceInputProps) {
    const { id, value, onSelect, text, setText } = props;
    const formID = `${id}-select-dice`;
    return (
        <UI.FlexRow formRow>
            <label htmlFor={formID}>
                Roll
            </label>
            <NumericInput id={formID}
                          min={1} max={99}
                          value={value} onSelect={onSelect}
                          text={text} setText={setText} />
            <span>dice</span>
            &nbsp;
        </UI.FlexRow>
    );
}

type TitleProps = HasID & {
    title: string,
    setTitle: Setter<string>,
    flavor: string,
}

/** RollTitleInput renders the title amount selector */
function RollTitleInput(props: TitleProps) {
    const { id, title, setTitle, flavor } = props;
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setTitle(e.target.value);
    }, [setTitle]);
    const formID = `${id}-title`;

    return (
        <UI.FlexRow formRow>
            <label htmlFor={formID}>
                to
            </label>
            <UI.Input id={formID} expand
                      placeholder={flavor}
                      onChange={onChange}
                      value={title} />
        </UI.FlexRow>
    )
}

/** PushLimitInput renders the "push the limit" checkbox */
function PushLimitInput(props: ToggleProps & HasID & Disableable) {
    const { id, checked, setChecked, disabled, color } = props;
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setChecked(e.target.checked);
    }, [setChecked]);

    return (
        <UI.FlexRow formRow>
        <UI.RadioLink id={`${id}-push-the-limit`}
                      type="checkbox" light
                      checked={checked} disabled={disabled}
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

type GlitchyToggleProps = Colorable & HasID & {
    glitchy: number,
    setGlitchy: Setter<number|null>,
}

function GlitchyInput(props: GlitchyToggleProps) {
    const { id, color, glitchy, setGlitchy } = props;
    const onEnableChange = React.useCallback(
        (_e: React.ChangeEvent<HTMLInputElement>) => {
            setGlitchy(g => g === 0 ? 1 : 0);
    }, [setGlitchy]);
    const glitchyID = `${id}-glitchiness`;

    return (
        <UI.FlexRow inputRow maxWidth flexWrap>
            <UI.RadioLink id={`${id}-use-glitchiness`}
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
                <NumericInput small id={glitchyID}
                              min={-99} max={99}
                              placeholder={`${props.glitchy}`}
                              onSelect={setGlitchy} />
            }
            {props.glitchy !== 0 &&
                <GlitchyExplainLabel htmlFor={glitchyID}>
                        {props.glitchy > 0 ? "Reduce " : "Increase "}
                        number of 1s needed to glitch
                        by {Math.abs(props.glitchy)}.
                </GlitchyExplainLabel>
            }
        </UI.FlexRow>
    );
}

type Props = HasID & Colorable & {
    editing: boolean,
    loading: boolean,
    setLoading: Setter<boolean>,
    event: Event.DiceEvent,
    onEdit: (event: Event.DiceEvent) => void,
    onSubmit: () => void,
}

/** Editing menu for a dice roll. */
export default function EditMenu(props: Props) {
    const cmdDispatch = React.useContext(Event.CmdCtx);
    const { id, editing, loading, color, setLoading, event, onSubmit } = props;


    const [title, setTitle] = React.useState(event.title);
    const [diceCount, setDiceCount] = React.useState<number|null>(
        event.ty == "roll" ? event.dice.length : event.rounds[0].length
    );
    const [diceText, setDiceText] = React.useState<string>(
        diceCount ? diceCount.toString() : ""
    );
    const [edge, setEdge] = React.useState(event.ty === "edgeRoll");
    const [glitchy, setGlitchy] = React.useState<number|null>(event.glitchy);
    const [showGlitchy, setShowGlitchy] = React.useState(event.glitchy !== 0);

    let edgeActionsDisabled = false;
    let diceDiff = 0;
    if (editing) {
        const stats = rollStats.results(event);
        const oldDice = "dice" in event ? event.dice.length : event.rounds[0].length;
        edgeActionsDisabled = stats.edged;
        diceDiff = (diceCount || oldDice) - oldDice;
    }

    return (
        <UI.FlexColumn>
            <UI.FlexRow maxWidth flexWrap>
                <RollDiceInput value={diceCount} onSelect={setDiceCount}
                               text={diceText} setText={setDiceText}
                               id={id} />
                <RollTitleInput title={title} setTitle={setTitle}
                                flavor="foo" id={id} />
                <Space.FlexGrow />
                <PushLimitInput checked={edge} setChecked={setEdge}
                                color={color} id={id} disabled={edgeActionsDisabled} />
            </UI.FlexRow>
            <UI.FlexRow formRow maxWidth>
                <GlitchyInput glitchy={glitchy || 0} setGlitchy={setGlitchy}
                              color={color} id={id} />
                <Space.FlexGrow />
                Submit
            </UI.FlexRow>
        </UI.FlexColumn>
    );
}
