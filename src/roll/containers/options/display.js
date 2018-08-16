// @flow

import '../../../App.css';
import '../roll-input-panel.css';

import React from 'react';
import { FormGroup, Radio } from 'react-bootstrap';

import type { DisplayMode } from '../..';

type Props = {
    onChange: (DisplayMode) => void;
    mode: DisplayMode
};

export default function DisplayOptions(props: Props) {
    function onChange(event: SyntheticInputEvent<HTMLInputElement>) {
        switch (event.target.name) {
            case "max": case "min": case "all":
            props.onChange(event.target.name); return;
            default: return;
        }
    }

    return (
        <div className="form-group">
            <div className="form-check form-check-inline">
                <input type="radio"
                       id="display-type-max"
                       name="max"
                       class="form-check-input"
                       checked={props.mode === "max"}
                       onChange={onChange} />
                <label className="form-check-label" htmlFor="dispay-type-max">
                    <blink>Maximum</blink>
                </label>
            </div>
            <div className="form-check form-check-inline">
                <input type="radio"
                       id="display-type-min"
                       name="min"
                       class="form-check-input"
                       checked={props.mode === "min"}
                       onChange={onChange} />
                <label className="form-check-label" htmlFor="dispay-type-min">
                    Minimum
                </label>
            </div>
            <div className="form-check form-check-inline">
                <input type="radio"
                       id="display-type-all"
                       name="all"
                       class="form-check-input"
                       checked={props.mode === "all"}
                       onChange={onChange} />
                <label className="form-check-label" htmlFor="dispay-type-all">
                    All
                </label>
            </div>
        </div>
    );
}
