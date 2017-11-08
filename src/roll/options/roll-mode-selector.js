// @flow

import React, { Component } from 'react';
import {
    FormGroup,
    DropdownButton, MenuItem, Glyphicon
 } from 'react-bootstrap';

import type { RollMode } from '../types';
import { RollModes } from '../types';

type Props = {
    selected: RollMode;
    onSelect: (RollMode) => void;
};

const rollSelections = Object.keys(RollModes).map(option =>
    <MenuItem eventKey={option} key={option}
              disabled={RollModes[option].disabled}
              className="roll-input-mode-item">
        {RollModes[option].title}
    </MenuItem>
);

export default function RollModeSelector(props: Props) {
    console.log("RollModeSelector", props);
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
        <FormGroup id='roll-input-mode-group'
                   controlId="roll-input-mode">
            <DropdownButton bsSize="large"
                            noCaret
                            id='roll-mode-selector-drop-down'
                            key={props.selected}
                            title={dropdownTitle}
                            onSelect={handleSelect}>
            {rollSelections}
        </DropdownButton>
        </FormGroup>
    );
}
