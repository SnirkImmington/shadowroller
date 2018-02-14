// @flow

import './App.css';

import * as React from 'react';
import {
    Nav, Navbar,
    Panel, PanelGroup,
    NavItem,
    Tabs, Tab,
    Button,
    ListGroup, ListGroupItem,
    Label,
    Well,
} from 'react-bootstrap';
import { connect } from 'react-redux';

import { AppNav, Page } from './navigation/components';

import DamageTrack from './components/damage-track';

import RollInputPanel from './roll/containers/roll-input-panel';
import RollHistoryPanel from './roll/containers/roll-history-panel';
import HistoryPanel from './components/history-panel';


import type { AppState, DispatchFn } from './state';
import * as rollActions from './roll/actions';

type Props = {
    dispatch: DispatchFn
};

type State = { };

//* Main page component. */
class App extends React.Component<Props, State> {
    componentDidMount() {
        this.props.dispatch(rollActions.fetchBuffer());
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">Shadowroller</h1>
                </header>
                <div className="App-main">
                    <AppNav />
                    <Well className="status-bar-well">
                        <div className="status-bar">
                            <span className="status-condition">
                                <span className='physical-condition'>
                                    <Label className='status-label'>Physical</Label>
                                    <DamageTrack max={11} damage={2} />
                                    <Button className='status-button'
                                            bsStyle="danger" bsSize='small'>
                                        Ouch
                                    </Button>
                                </span>
                                <span className='stun-condition'>
                                    <Label className="status-label">Stun</Label>
                                    <DamageTrack max={12} damage={5} />
                                    <Button className='status-button'
                                            bsSize='small' bsStyle='warning'>
                                        Oof
                                    </Button>
                                </span>
                            </span>
                            <span className='status-init'>
                                <Button className='status-item'
                                        bsStyle='primary' bsSize='small'>
                                    Roll Initiative
                                </Button>
                            </span>
                            <span className='modifiers'>
                                <Label bsStyle='info' className='status-label'>AR hotsim</Label>
                                <Label bsStyle='warning' className='status-label'>-3 condition</Label>
                            </span>
                        </div>
                    </Well>
                    <div id="App-window-container">
                        <Page />
                        <HistoryPanel />
                    </div>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state: AppState) {
    return { };
}

export default connect(mapStateToProps)(App);
