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
                    <Tabs justified defaultActiveKey="combat"
                          className="panel-text-left">
                        <Tab eventKey="combat" title="Combat">
                            <h4 className="skill-tab-header">
                                Skills for using weapons and fighting.
                            </h4>
                            <ListGroup className="scroll-list">
                                {entry("Archery", "Agility", 0)}
                                {entry("Astral Combat", "Magic", 0, false)}
                                {entry("Automatics", "Agility", 8)}
                                {entry("Blades", "Agility", 3)}
                                <ListGroupItem header={"Clubs"} onClick={() => {}}>
                                    Skill(6) + Agility(2)
                                    <p />
                                    <RollInputPanel />
                                </ListGroupItem>
                                {entry("Gunnery", "Reaction", 0)}
                                {entry("Heavy Weapons", "Agility", 4)}
                                {entry("Longarms", "Agility", 0)}
                                {entry("Pistols", "Agility", 0)}
                                {entry("Throwing Weapons", "Agility", 0)}
                                {entry("Unarmed Combat", "Agility", 5)}
                            </ListGroup>
                        </Tab>
                        <Tab eventKey="active" title="Active">
                            <h4 className="skill-tab-header">
                                Active skills for infiltration and survival.
                            </h4>
                            {entry("Disguise", "Intuition", 0)}
                            {entry("Diving", "Body", 0)}
                            {entry("Escape Artist", "Agility", 4)}
                            {entry("Free-fall", "Body", 0)}
                            {entry("Gymnastics", "Agility", 0)}
                            {entry("Perception", "Agility", 0)}
                            {entry("Running", "Agility", 0)}
                            {entry("Sneaking", "Agility", 6)}
                            {entry("Survival", "Willpower", 0)}
                            {entry("Swimming", "Strength", 0)}
                            {entry("Tracking", "Intuition", 0)}
                        </Tab>
                        <Tab eventKey="technical" title="Technical">
                            <h4 className="skill-tab-header">
                                Technical skills for hacking, repairing, and piloting.
                            </h4>
                            {entry("Aeronotics Mechanic", "Logic", 0, false)}
                            {entry("Animal Handling", "Charisma", 0)}
                            {entry("Armoroer", "Logic", 4)}
                            {entry("Artisan", "Intuition", 0, false)}
                            {entry("Automotive Mechanic", "Logic", 0, false)}
                        </Tab>
                        <Tab eventKey="magic" title="Magic">
                            <h4 className="skill-tab-header">
                                Magic-related skills.
                            </h4>
                            {entry("Alchemy", "Magic", 0, false)}
                            {entry("Arcana", "Logic", 0, false)}
                            {entry("Artificing", "Magic", 0, false)}
                            {entry("Banishing", "Magic", 0, false)}
                            {entry("Binding", "Magic", 0, false)}
                            {entry("Counterspelling", "Magic", 0, false)}
                            {entry("Spellcasting", "Magic", 0, false)}
                            {entry("Summoning", "Magic", 0, false)}
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
