// @flow

import React, { Component } from 'react';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

type RollAgainstProps = {
    onChange: (?number) => void;
    value: ?number
};

function RollAgainstRollOptions(props: RollAgainstProps) {
    function handleRollAgainstChange(event: SyntheticInputEvent<HTMLInputElement>) {
        if (!isNaN(parseInt(event.target.value, 10))) {
            const rollAgainst: number = parseInt(event.target.value, 10);
            if (rollAgainst > 0) {
                props.onChange(rollAgainst);
                return;
            }
        }
        props.onChange(null);
    }
    return (
        <FormGroup controlId="roll-input-roll-against">
            <FormControl className="numeric-input"
                         type="input"
                         bsSize="large"
                         value={props.value || ''}
                         onChange={handleRollAgainstChange} />
            <ControlLabel className="roll-menu-label">
                dice
            </ControlLabel>
        </FormGroup>
    );
}

export default RollAgainstRollOptions;
