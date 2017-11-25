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
        <FormGroup controlId="roll-input-highlight-maximum"
                   className="roll-input-options">
            <Radio inline name="max" title="Maximum"
                   checked={props.mode === "max"}
                   onChange={onChange}>
                <b className="menu-label">Maximum</b>
            </Radio>
            <Radio inline name="min" title="Minimum"
                checked={props.mode === "min"}
                onChange={onChange}>
                <b className="menu-label">Minimum</b>
            </Radio>
            <Radio inline name="all" title="All"
                checked={props.mode === "all"}
                onChange={onChange}>
                <b className="menu-label">All</b>
            </Radio>
        </FormGroup>
    );
}
