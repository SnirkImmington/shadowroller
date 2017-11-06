// @flow

import React, { Component } from 'react';

import { Stat, } from './types';
import type { StatsType } from './types';


// Panel for displaying stat blocks.

type Props = {
    onStatPicked: (string, number) => void;
    onRollableStatPicked: (string, number) => void;
};

type State = {
    stats: Map<string, Stat>,
    statsType: StatsType
}

export default class StatBlocksPanel extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            stats: new Map(),
            statsType: "combat"
        };
    }

    render() {
        return (
            <div id="stat-blocks-panel">
                <StatTypePicker />
                <StatBlock statsFor={this.state.statsType} />
            </div>
        );
    }
}
