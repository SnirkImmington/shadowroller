// @flow

import React, { Component } from 'react';

import { FormControl } from 'react-bootstrap';

type Props = {
    onSelect: (?number) => void;
    value?: number | string;
    min?: number;
    max?: number;
};


export default function NumericInput(props: Props) {
    function handleInputEvent(event: SyntheticInputEvent<HTMLInputElement>) {
        console.log("Numeric input: ", event.target.value);
        const value: number = parseInt(event.target.value, 10);
        console.log("Parsed: ", value);
        if (isNaN(value)
                || (props.min != null && value < props.min)
                || (props.max != null && value > props.max)) {
            props.onSelect(null);
        }
        else {
            console.log("Returning", value);
            props.onSelect(value);
        }
    }

    let value = "";
    if (props.value != null) {
        value = props.value;
    }

    return (
        <FormControl className="numeric-input"
                     type="input"
                     bsSize="large"
                     value={value}
                     onChange={handleInputEvent} />
    );
}
