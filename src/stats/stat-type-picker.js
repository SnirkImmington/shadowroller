// @flow

import React, { Component } from 'react';
import { Tabs, Tab } from 'react-bootstrap';

import type { StatsType } from './types';
import capitalize from '../util/capitalize';

import './stats-panel.css';

type Props = {
    onSelect: (StatsType) => void;
    selected: StatsType;
};

export default function StatTypePicker(props: Props) {

    function statsTypeItem(type: StatsType, disabled: boolean) {
        const titled = capitalize(type);
        return (
            <Tab className="stat-type-picker-item"
                     eventKey={type}
                     disabled={disabled}
                     title={titled}>
            </Tab>
        );
    }

    const navItems = [
        statsTypeItem("combat", false),
        statsTypeItem("decking", false),
        statsTypeItem("magic", true),
        statsTypeItem("technomancy", true),
    ];

    return (
        <Tabs justified
             id="stat-type-picker"
             bsStyle="tabs"
             defaultActiveKey={props.selected}
             onSelect={props.onSelect}>
            {navItems}
        </Tabs>
    )
}
