// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import type { StyledComponent } from 'styled-components';

const RainbowDiv: StyledComponent<> = styled.input.attrs(props => ({
    type: "range",
    min: 0, max: 360,
}))`
    height: 1.5em;
    width: 40em;

    background: linear-gradient(
        to right,
        hsl(  0, 80%, 56%),
        hsl( 20, 80%, 56%),
        hsl( 40, 80%, 56%),
        hsl( 60, 80%, 56%),
        hsl( 80, 80%, 56%),
        hsl(100, 80%, 56%),
        hsl(120, 80%, 56%),
        hsl(140, 80%, 56%),
        hsl(160, 80%, 56%),
        hsl(180, 80%, 56%),
        hsl(200, 80%, 56%),
        hsl(220, 80%, 56%),
        hsl(240, 80%, 56%),
        hsl(260, 80%, 56%),
        hsl(280, 80%, 56%),
        hsl(300, 80%, 56%),
        hsl(320, 80%, 56%),
        hsl(340, 80%, 56%),
        hsl(360, 80%, 56%)
    );
`;

export default function ColorPicker() {
    function onMouseMove(e: SyntheticMouseEvent<HTMLDivElement>) {
        if (!e.buttons) {
            return;
        }
        updateThingie(e, "move");
    }

    function onClick(e: SyntheticMouseEvent<HTMLDivElement>) {
        updateThingie(e, "click");
    }

    function onKeyPressed(e: SyntheticInputEvent<HTMLDivElement>) {
        console.log("Key pressed", e);
    }

    function updateThingie(e: SyntheticMouseEvent<HTMLDivElement>, cause: string) {
        e.persist();
        console.log("Mouse move", cause, e.clientX, e)
    }

    return (
        <RainbowDiv onMouseMove={onMouseMove} onClick={onClick} onKeyPressed={onKeyPressed} />
    );
}
