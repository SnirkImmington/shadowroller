import * as React from 'react';
import styled from 'styled-components/macro';

import * as UI from 'style';
import * as icons from 'style/icon';
import * as layout from 'layout';
import NumericInput from 'component/NumericInput';
import type { Selector } from 'component/NumericInput';
import type { Colorable } from 'component/props';

import * as srutil from 'srutil';

const GlitchyExplainLabel = styled.label({
    padding: layout.Space.Small
});

export type Props = Colorable & {
    baseID: string,
    glitchy: number,
    setGlitchy: srutil.Setter<number>,
    onGlitchySelect: Selector,
};

export default function GlitchyInput(props: Props) {
    const { baseID, color, glitchy, setGlitchy, onGlitchySelect } = props;

    const onEnableChange = React.useCallback(function onChange() {
        setGlitchy(g => g === 0 ? 1 : 0);
    }, [setGlitchy]);

    return (
        <UI.FlexRow inputRow flexWrap>
            <UI.RadioLink id={`${baseID}-is-glitchy`}
                type="checkbox" light
                checked={glitchy !== 0}
                onChange={onEnableChange}>
                <UI.TextWithIcon color={color}>
                    <UI.FAIcon transform="grow-1" className="icon-inline"
                        icon={icons.faSkullCrossbones} />
                    Glitchy
                </UI.TextWithIcon>
            </UI.RadioLink>
            {glitchy !== 0 && (<>
                <NumericInput small id={`${baseID}-glitchiness`}
                    min={-99} max={99}
                    placeholder={`${glitchy}`}
                    onSelect={onGlitchySelect} />
                <GlitchyExplainLabel htmlFor={`${baseID}-glitchiness`}>
                    {glitchy > 0 ? "Reduce " : "Increase "}
                    number of 1s needed to glitch
                    by {Math.abs(glitchy)}.
                </GlitchyExplainLabel>
            </>)}
        </UI.FlexRow>
    );
}
