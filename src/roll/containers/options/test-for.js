// @flow

import '../../../App.css';
import '../roll-input-panel.css';

import React from 'react';
import { FormGroup, ControlLabel } from 'react-bootstrap';
import NumericInput from '../../../components/numeric-input';

type Props = {
    onChange: (?number) => void;
    value: ?number
}

export default function TestForRollOptions(props: Props) {
    return (
        <FormGroup controlId="roll-input-test-for"
                   className="roll-input-options">
            <NumericInput controlId="roll-input-test-for"
                onSelect={props.onChange} />
            <ControlLabel className="menu-label">
                hits
            </ControlLabel>
        </FormGroup>
    );
}
