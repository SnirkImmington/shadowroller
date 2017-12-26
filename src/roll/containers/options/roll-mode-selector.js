// @flow

import './roll-mode-selector.css';

import React from 'react';
import {
    FormGroup,
    DropdownButton, MenuItem, Glyphicon
 } from 'react-bootstrap';

import type { RollMode } from '../../index';
import { RollModes } from '../../index';

type Props = {
    selected: RollMode;
    onSelect: (RollMode) => void;
};

const rollSelections = Object.keys(RollModes).map(option =>
    <MenuItem eventKey={option} key={option}
              className="roll-input-mode-item">
        {RollModes[option].title}
    </MenuItem>
);

export default function RollModeSelector(props: Props) {
    function handleSelect(mode: RollMode, event: SyntheticInputEvent<DropdownButton>) {
        props.onSelect(mode);
    }

    const dropdownTitle = (
        <span id="roll-mode-input-title">
            {RollModes[props.selected].title}
            <Glyphicon className="roll-mode-input-glyph"
                       glyph="menu-down" />
        </span>
    );

    return (
        <div className="roll-input-wrapper">
            <FormGroup controlId="roll-input-mode">
                <DropdownButton noCaret
                                key={props.selected}
                                title={dropdownTitle}
                                onSelect={handleSelect}>
                    {rollSelections}
                </DropdownButton>
            </FormGroup>
        </div>
    );
}
