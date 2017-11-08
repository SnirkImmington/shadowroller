// @flow

import React, { Component } from 'react';
import { FormGroup, ControlLabel } from 'react-bootstrap';
import NumericInput from '../../numeric-input';

type Props = {
    onChange: (?number) => void;
    value: ?number
};

export default function RollAgainstRollOptions(props: Props) {
    return (
        <FormGroup controlId="roll-input-roll-against"
                   className="roll-input-options">
            <NumericInput value={props.value || ''} min={0}
                          onSelect={props.onChange} />
            <ControlLabel className="roll-menu-label">
                dice
            </ControlLabel>
        </FormGroup>
    );
}
