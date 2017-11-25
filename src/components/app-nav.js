// @flow

import './app-nav.css';

import * as React from 'react';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import { connect } from 'react-redux';

import type { Action, DispatchFn } from '../../state';

type Props = {
    dispatch: DispatchFn,
}

class AppNav extends React.Component<Props> {
    handleSelect = (key: Navkey) => {

    }

    render() {
        return (
            <Navbar collapseOnSelect
                    onSelect={this.handleSelect}>
                <Navbar.Header>
                    <Navbar.Brand>
                    <b>Sombra</b>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <NavItem eventKey="actions">Actions</NavItem>
                        <NavItem eventkey="effects">Effects</NavItem>
                    </Nav>
                    <Nav pullRight>
                        <NavItem eventKey="character">Stats</NavItem>
                        <NavItem eventKey="skills">Skills</NavItem>
                        <NavItem eventKey="gear">Gear</NavItem>
                        <NavItem eventKey="export" disabled>Export</NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

export default connect()(AppNav);
