import * as React from 'react';
import styled from 'styled-components/macro';

const RainbowDiv = styled.div`
    height: 1.5em;
    width: 100%;

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

const HueInput = styled.input.attrs(_props => ({
    type: "range", min: 0, max: 360
}))`
    height: 1.5em;
    width: 100%;
    background-color: transparent;
    color: green;
    margin: auto 0;
`;

type Props = {
    style?: any;
    id?: string;
    value: number;
    onSelect: (value: number) => void;
}

export default function ColorPicker(props: Props) {
    function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
        props.onSelect(parseInt(e.target.value));
    }
    return (
        <RainbowDiv style={props.style}>
            <HueInput id={props.id} value={props.value} onChange={handleSelect} />
        </RainbowDiv>
    );
}
