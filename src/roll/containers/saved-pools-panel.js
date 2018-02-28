// @flow

import './saved-pools-panel.js';

import * as React from 'react';
import { Panel, FormGroup, ControlLabel, Label, Button } from 'react-bootstrap';
import { connect } from 'react-redux';
import CreatePoolForm from '../../pools/containers/create-pool-form';

import type { AppState, DispatchFn } from '../../state';

type Props = {
    dispatch: DispatchFn,
    state: {},
};

class SavedPoolsPanel extends React.Component<Props> {
    handleAddPool = (event: SyntheticInputEvent<HTMLButtonElement>) => {

    }

    render = () => {
        const title = (
            <span className='App-menu-panel-title'>
                <b>Dice Pools</b>
            </span>
        );

        return (
            <Panel id="pools-panel" header={title} bsStyle="warning">
                <CreatePoolForm />
                You have to save some pools to roll, chummer.
            </Panel>
        )
    }
}

function mapStateToProps(state: AppState) {
    return {};
}

export default connect(mapStateToProps)(SavedPoolsPanel);
