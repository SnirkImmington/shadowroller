// @flow

import '../../../App.css';

import React from 'react';
import NumericInput from '../../../components/numeric-input';

type Props = {
    onChange: (?number) => void;
    value: ?number
}

export default function TestForRollOptions(props: Props) {
    return (
        <div className="form-group">
            <NumericInput controlId="roll-input-test-for"
                          min={0}
                          onSelect={props.onChange} />
            <label htmlFor="roll-input-test-for">
                hits
            </label>
        </div>
    );
}
