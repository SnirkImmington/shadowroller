// @flow

import './App.css';

import React from 'react';

import RollInputPanel from './roll/containers/roll-input-panel';
import RollHistoryPanel from './roll/containers/roll-history-panel';

//* Main page component. */
export default function App(props: {}) {
    return (
        <div className="App rounded-0">
            <header className="App-header mb-2">
                <h1 className="App-title">Shadowroller</h1>
            </header>
            <div className="App-wide-container">
                <RollInputPanel />
                <RollHistoryPanel />
            </div>
        </div>
    );
}
