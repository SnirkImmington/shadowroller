// @flow

import './App.css';

import React, { Component } from 'react';
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

import AppNav from './navigation/components/app-nav';

import DamageTrack from './components/damage-track';

import RollInputPanel from './roll/containers/roll-input-panel';
import RollHistoryPanel from './roll/containers/roll-history-panel';
import HistoryPanel from './components/history-panel';
import AttributesPanel from './character/attributes/containers/attribute-panel';

//* Main page component. */
export default function App(props: {}) {
    function entry(name: string, attr: string, pool: number, canDefault: bool =  true) {
        let message;
        if (!canDefault && pool === 0) {
            message = (
                <span>
                    <i>Cannot default</i>
                </span>
            );
        }
        else if (pool === 0) {
            message = (
                <span>
                    Defaulting on{` ${attr}`}
                </span>
            );
        }
        else {
            message = (
                <span>
                    {`Skill (${pool - 2}) + ${attr}`}
                </span>
            );
        }

        return (
            <ListGroupItem header={name}
                           disabled={!canDefault && pool === 0}
                           onClick={() => {}}>
                    {message}
            </ListGroupItem>
        )
    }

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
                    <Tabs justified defaultActiveKey="combat"
                          className="panel-text-left">
                        <Tab eventKey="combat" title="Combat">
                            <h4>Skills for using weapons and fighting.</h4>
                            <ListGroup className="scroll-list">
                                {entry("Archery", "Agility", 0)}
                                {entry("Astral Combat", "Magic", 0, false)}
                                {entry("Automatics", "Agility", 8)}
                                {entry("Blades", "Agility", 3)}
                                <RollInputPanel />
                                {entry("Clubs", "Agility", 0)}
                                {entry("Heavy Weapons", "Agility", 4)}
                                {entry("Longarms", "Agility", 0)}
                                {entry("Pistols", "Agility", 0)}
                                {entry("Throwing Weapons", "Agility", 0)}
                                {entry("Unarmed Combat", "Agility", 5)}
                            </ListGroup>
                        </Tab>
                        <Tab eventKey="active" title="Active">
                            Active skills for infiltration and survival.
                        </Tab>
                        <Tab eventKey="technical" title="Technical" disabled>
                            Technical skills for hacking, repairing, and piloting.
                        </Tab>
                        <Tab eventKey="magic" title="Magic">
                            The trio of magic-related skills.
                        </Tab>
                        <Tab eventKey="social" title="Social">
                            For all your facing needs.
                        </Tab>
                        <Tab eventKey="knowledge" title="Knowledge">

                        </Tab>
                    </Tabs>
                    <HistoryPanel />
                </div>
            </div>
        </div>
    );
}
