// @flow

import './app-nav.css';

import * as React from 'react';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import FavorText from '../../components/favortext';
import { connect } from 'react-redux';

import type { DispatchFn, AppState } from '../../state';

type Props = {
    dispatch: DispatchFn,
    characterName: string
};

class AppNav extends React.Component<Props> {
    handleSelect = (key: string) => {

    }

    render() {
        return (
            <Navbar collapseOnSelect id="app-navbar"
                    onSelect={this.handleSelect}>
                <Navbar.Header>
                    <Navbar.Brand>
                        <b>Sombra</b>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <NavItem eventKey="combat" disabled>Combat</NavItem>
                        <NavItem eventKey="skills">Skills</NavItem>
                        <NavItem eventKey="edit-stats">Attributes</NavItem>
                        <NavItem eventKey="edit-gear" disabled>Gear</NavItem>
                    </Nav>
                    <Nav pullRight>
                        <NavItem eventKey="edit" disabled>Edit</NavItem>
                        <NavItem eventKey="export">Import</NavItem>
                        <NavItem disabled eventKey="export">Export</NavItem>
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        characterName: state.name || "Sombra",
    };
}

export default connect(mapStateToProps)(AppNav);
