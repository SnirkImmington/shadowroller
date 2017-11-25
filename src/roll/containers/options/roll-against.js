// @flow

import '../../../App.css';
import '../roll-input-panel.css';

import React from 'react';
import { FormGroup, ControlLabel } from 'react-bootstrap';
import NumericInput from '../../../components/numeric-input';

type Props = {
    onChange: (?number) => void;
    value: ?number
};

export default function RollAgainstRollOptions(props: Props) {
    return (
        <FormGroup controlId="roll-input-roll-against"
                   className="roll-input-options">
            <NumericInput min={0} max={99}
                          value={props.value || ''}
                          onSelect={props.onChange} />
            <ControlLabel className="menu-label">
                dice
            </ControlLabel>
        </FormGroup>
    );
}