// @react

import React, { Component } from 'react';
import { Grid, Row, Col, Panel } from 'react-bootstrap';

import StatTypePicker from './stats-type-picker';

import { Stat } from './types'
import type StatsType from './types';

import './stats-panel.css';

type Props = {

};

type State = {
    statsType: StatsType;
};

export default class StatsPanel extends Component<{}, State> {
    render() {
        return (
            <Panel header="Stats">
            </Panel>
        )
    }
}
