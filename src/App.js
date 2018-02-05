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

import SkillsTabs from './character/skills/containers/skills-tabs';

//* Main page component. */
export default function App(props: {}) {
    function entry(name: string, attr: string, pool: number, canDefault: bool =  true) {
        let message;
        if (!canDefault && pool === 0) {
            message = (
                <span>
                    Cannot default
                </span>
            );
        }
        else if (pool === 0) {
            message = (
                <span>
                    Default on{` ${attr} (2)`}
                </span>
            );
        }
        else {
            message = (
                <span>
                    {`Skill (${pool - 2}) + ${attr} (2)`}
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
                    <SkillsTabs />
                    <HistoryPanel />
                </div>
            </div>
        </div>
    );
}
