// @flow

import React, { Component } from 'react';
import { FormGroup, ControlLabel, FormControl } from 'react-bootstrap';

type TestForProps = {
    onChange: (?number) => void;
    value: ?number
}

export default function TestForRollOptions(props: TestForProps) {
    function handleTestForChange(event: SyntheticInputEvent<HTMLInputElement>) {
        if (!isNaN(parseInt(event.target.value, 10))) {
            const testFor: number = parseInt(event.target.value, 10);
            if (testFor > 0) {
                props.onChange(testFor);
                return;
            }
        }
        props.onChange(null);
    }
    return (
        <FormGroup controlId="roll-input-test-for">
            <FormControl className="numeric-input"
                          type="input"
                          bsSize="large"
                          value={props.value || ''}
                          onChange={handleTestForChange} />
            <ControlLabel className="roll-menu-label">
                hits
            </ControlLabel>
        </FormGroup>
    );
}
