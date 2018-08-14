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
    Label, Alert,
    Well,
} from 'react-bootstrap';
import { connect } from 'react-redux';

import { AppNav, Page } from './navigation/components';

import DamageTrack from './components/damage-track';
import FavorText from './components/favortext';

import RollInputPanel from './roll/containers/roll-input-panel';
import RollHistoryPanel from './roll/containers/roll-history-panel';
import HistoryPanel from './components/history-panel';


import type { AppState, DispatchFn } from './state';
import * as rollActions from './roll/actions';

type Props = {
    dispatch: DispatchFn
};

type State = { };

const SUBTITLES: React.Node[] = [
    "Welcome to the shadows",
    "Welcome to the shadows, chummer",
    "Let your eyes adjust to the shadows",
    "Heroes often die",
    ""
];

/*
(/*<Well className="status-bar-well">
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
*/

//* Main page component. */
class App extends React.Component<Props, State> {
    componentDidMount() {
        this.props.dispatch(rollActions.fetchBuffer());
    }

    render() {
        return (
            <div className="App">
                <div className="App-header2">
                    <div className="app-header-content">
                        <h1 className="App-title2">Shadowroller</h1>
                        <div className="app-header-extra">
                            <h5 className="App-subtitle">
                                <FavorText from={SUBTITLES} />
                            </h5>
                            <div className="app-links">
                                <a className="App-link">Skills</a>
                                <a className="App-link">Combat</a>
                                <a className="App-link" enabled="false">Gear</a>
                                <a className="App-link">Edit</a>
                            </div>
                        </div>
                    </div>
                </div>
                    <div className="App-main">
                    <div id="App-window-container">
                        <Page />
                        <Panel bsStyle="info" header="Selection">
                            <ListGroup>
                                <ListGroupItem eventKey="first">
                                    <Label>Automatics</Label> 5
                                    + <Label>Agility</Label> 4
                                </ListGroupItem>
                                <ListGroupItem eventKey="1">
                                        Automatics <Label>+5</Label>
                                        Agility <Label>+5</Label>
                                </ListGroupItem>
                                <ListGroupItem>
                                    <Label>+4</Label>
                                    Automatics
                                </ListGroupItem>
                                <ListGroupItem>
                                    <Label>+5</Label>
                                    Agility
                                </ListGroupItem>
                                <ListGroupItem>
                                    <Label>+2</Label>
                                </ListGroupItem>
                            </ListGroup>
                            <div style={{"max-width": "350px"}}>
                                <RollInputPanel />
                            </div>
                        </Panel>
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
