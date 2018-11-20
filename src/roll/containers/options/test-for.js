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
        <div className="row">
            <div className="col-12 col-lg-auto my-2 my-lg-auto">
                <NumericInput controlId="roll-input-test-for"
                              min={0} value={props.value}
                              onSelect={props.onChange} />
            </div>
            <div className="col-12 col-lg-auto my-lg-auto">
                hits
            </div>
        </div>
    );
}
