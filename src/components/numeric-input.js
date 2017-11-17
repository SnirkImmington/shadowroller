// @flow

import React from 'react';

import { FormControl } from 'react-bootstrap';

type Props = {
    onSelect: (?number) => void;
    value?: number | string;
    min?: number;
    max?: number;
};

/** Number-oriented input. */
export default function NumericInput(props: Props) {
    function handleInputEvent(event: SyntheticInputEvent<HTMLInputElement>) {
        const value: number = parseInt(event.target.value, 10);
        if (isNaN(value)
                || (props.min != null && value < props.min)
                || (props.max != null && value > props.max)) {
            props.onSelect(null);
        }
        else {
            props.onSelect(value);
        }
    }

    let value = "";
    if (props.value != null) {
        value = props.value;
    }

    return (
        <FormControl className="numeric-input"
                     type="number"
                     value={value}
                     onChange={handleInputEvent} />
    );
}
