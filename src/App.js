// @flow

import './App.css';

import React from 'react';
import {
    Nav, Navbar, Panel, PanelGroup, NavItem, Tabs, Tab, Button, ListGroup, ListGroupItem, Label,
} from 'react-bootstrap';

import AppNav from './navigation/components/app-nav';

import DamageTrack from './components/damage-track';

import RollInputPanel from './roll/containers/roll-input-panel';
import RollHistoryPanel from './roll/containers/roll-history-panel';
import AttributesPanel from './character/attributes/containers/attribute-panel';

//* Main page component. */
export default function App(props: {}) {
    return (
        <div className="App">
            <header className="App-header">
                <h1 className="App-title">Shadowroller</h1>
            </header>
            <div className="App-main">
                <AppNav />
                <Panel id="health-bar-panel">
                    <div className="health-bar">
                    <span className="health-bar-item">
                        Physical: <DamageTrack max={10} damage={5} />
                        <Button>Ouch</Button>
                    </span>
                    <span className="health-bar-item">
                        Stun: <DamageTrack max={8} damage={4} />
                        <Button>Oof</Button>
                    </span>
                    </div>
                </Panel>
                <div id="App-window-container">
                    <Tabs justified defaultActiveKey="skills" className="panel-text-left">
                        <Tab disabled eventKey="combat" title="Combat">
                        </Tab>
                        <Tab disabled eventKey="matrix" title="Matrix">
                        </Tab>
                        <Tab disabled eventKey="magic" title="Magic">
                        </Tab>
                        <Tab disabled eventKey="rigging" title="Rigging">
                        </Tab>
                        <Tab eventKey="active" title="Active">
                            <Panel>
                                Actions related to specific skills, like
                                stealth or perception.
                            </Panel>
                            <ListGroup fill>
                                <ListGroupItem>
                                    Thing
                                    <Button>Do it</Button>
                                </ListGroupItem>
                                <ListGroupItem>
                                    Do the other thing
                                    <Button>Do it</Button>
                                </ListGroupItem>
                            </ListGroup>
                        </Tab>
                        <Tab eventKey="knowledge" title="Knowledge">
                            knowing stuff
                        </Tab>
                    </Tabs>
                    <AttributesPanel editable={false}
                                     onAttributeChange={(ty, num) => {}} />
                </div>
                <Panel>
                    <div className='health-bar'>
                        <span className='healh-bar-item'>Initiative: 12</span>
                    <Label bsStyle='info' className='health-bar-item'>AR hotsim</Label>
                    <Label bsStyle='warning' className='health-bar-item'>-3 condition</Label>
                    </div>
                </Panel>
                <RollInputPanel />
                <RollHistoryPanel />
            </div>
        </div>
    );
}
