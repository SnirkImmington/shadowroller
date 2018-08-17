// @flow

import '../../../App.css';

import React from 'react';
import NumericInput from '../../../components/numeric-input';

type Props = {
    onChange: (?number) => void;
    value: ?number
};

export default function RollAgainstRollOptions(props: Props) {
    return (
        <div className="form-group">
            <NumericInput controlId="roll-input-roll-against"
                          min={1} max={100}
                          onSelect={props.onChange} />
            <label htmlFor="roll-input-roll-against">
                dice
            </label>
        </div>
    );
}
