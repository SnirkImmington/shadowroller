// @flow

import './app-nav.css';

import * as React from 'react';
import { Nav, Navbar, NavItem } from 'react-bootstrap';
import { connect } from 'react-redux';

import type { DispatchFn, AppState } from '../../state';
import { ALL_PAGES } from '..';
import type { Page } from '..';
import * as navActions from '../actions';

import * as utils from '../../util';

type Props = {
    dispatch: DispatchFn,
    state: AppState
};

class AppNav extends React.Component<Props> {
    handleSelect = (key: Page) => {
        this.props.dispatch(navActions.selectPage(key));
    }

    navItem(page: Page): React.Node {
        if (page === this.props.state.nav.page) {
            return (
                <NavItem eventKey={page}
                         disabled={ALL_PAGES[page].disabled}>
                    <b>{utils.format(page, 'title')}</b>
                </NavItem>
            );
        }
        else {
            return (
                <NavItem eventKey={page}
                         disabled={ALL_PAGES[page].disabled}>
                    {utils.format(page, 'title')}
                </NavItem>
            );
        }
    }

    render() {
        return (
            <Navbar collapseOnSelect id="app-navbar"
                    onSelect={this.handleSelect}>
                <Navbar.Header>
                    <Navbar.Brand>
                        <b>{this.props.state.character.name}</b>
                    </Navbar.Brand>
                    <Navbar.Toggle />
                </Navbar.Header>
                <Navbar.Collapse>
                    <Nav>
                        {this.navItem("combat")}
                        {this.navItem("skills")}
                        {this.navItem("attributes")}
                        {this.navItem("gear")}
                    </Nav>
                    <Nav pullRight>
                        {this.navItem("edit")}
                        {this.navItem("import")}
                        {this.navItem("export")}
                    </Nav>
                </Navbar.Collapse>
            </Navbar>
        );
    }
}

function mapStateToProps(state: AppState) {
    console.log("Connecting app nav state:", state);
    return { state };
}

export default connect(mapStateToProps)(AppNav);
