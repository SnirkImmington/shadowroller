// @flow

import React, { Component } from 'react';

import RollMenu from './roll/roll-menu';
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
                    <RollMenu />
                </div>
            </div>
        );
    }
}
