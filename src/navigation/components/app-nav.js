// @flow

import './app-nav.css';

import * as React from 'react';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import FavorText from '../../components/favortext';
import { connect } from 'react-redux';

import type { DispatchFn, AppState } from '../../state';

const ACTIONS_FLAVORTEXT: React.Node[] = [
    "Actions",
    "Actions",
    "Actions",
    <span><i>Do</i>{" stuff"}</span>
];

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
                        <b>Shadowroller</b>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        <NavItem eventKey="pick-actions">
                            <FavorText from={ACTIONS_FLAVORTEXT} />
                        </NavItem>
                    </Nav>
                    <Nav pullRight>
                        <NavItem eventKey="edit-modifiers">Modifiers</NavItem>
                        <NavItem eventKey="edit-stats">Stats</NavItem>
                        <NavItem eventKey="edit-skills">Skills</NavItem>
                        <NavItem eventKey="edit-gear" disabled>Gear</NavItem>
                        <NavItem eventKey="export" disabled>Export</NavItem>
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
