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
        <div className="row">
            <div className="col-12 col-lg-auto mx-lg-auto my-2 my-lg-auto">
                <NumericInput controlId="roll-input-roll-against"
                              min={1} max={100} value={props.value}
                              onSelect={props.onChange} />
            </div>
            <div className="col-12 col-lg-auto my-lg-auto">
                dice
            </div>
        </div>
    );
}
