// @flow

import React, { Component } from 'react';
import {
    Panel,
    Navbar, Nav, NavItem,
    Glyphicon,
} from 'react-bootstrap';

import RollMenu from './roll/roll-menu';
import AttributePanel from './stats/attribute-panel';
import './App.css';
import './roll/roll-menu.css';

/// Main page component.
export default class App extends Component<{}> {
    constructor(props: {}) {
        super(props);
    }

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <h1 className="App-title">Shadowroller</h1>
                </header>
                <div className="App-wide-container">
                    <Navbar id="App-nav"
                            className=".App-wide"
                            collapseOnSelect
                            onSelect={(key, event) => event.preventDefault()}>
                        <Navbar.Header>
                            <Navbar.Brand>
                            <b>Sombra</b>
                            </Navbar.Brand>
                            <Navbar.Toggle />
                        </Navbar.Header>
                        <Navbar.Collapse>
                        <Nav>
                            <NavItem eventKey="combat">Combat</NavItem>
                            <NavItem eventKey="decking" disabled>Decking</NavItem>
                            <NavItem disabled>Magic</NavItem>
                            <NavItem disabled>Rigging</NavItem>
                            <NavItem disabled>Technomancy</NavItem>
                        </Nav>
                        <Nav pullRight>
                            <NavItem disabled>Character</NavItem>
                            <NavItem disabled>Gear</NavItem>
                            <NavItem disabled>Effects</NavItem>
                            <NavItem disabled>Actions</NavItem>
                            <NavItem disabled>Save</NavItem>
                        </Nav>
                        </Navbar.Collapse>
                    </Navbar>
                    <div id="App-window-container">
                        <Panel id="App-window-combat" header="Combat">
                        </Panel>
                        <AttributePanel onAttributeChange={(ty, num) => {}} />
                    </div>
                    <RollMenu />
                </div>
            </div>
        );
    }
}
