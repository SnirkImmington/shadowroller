// @flow

import React, { Component } from 'react';
import { FormGroup, ControlLabel } from 'react-bootstrap';
import NumericInput from '../../numeric-input';

type Props = {
    onChange: (?number) => void;
    value: ?number
}

export default function TestForRollOptions(props: Props) {
    return (
        <FormGroup controlId="roll-input-test-for"
                   className="roll-input-options">
            <NumericInput value={props.value || ''} min={0}
                          onSelect={props.onChange} />
            <ControlLabel className="roll-menu-label">
                hits
            </ControlLabel>
        </FormGroup>
    );
}
