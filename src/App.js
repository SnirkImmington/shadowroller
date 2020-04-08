// @flow

import './App.css';

import * as React from 'react';

import RollInputPanel from './roll/containers/roll-input-panel';
import RollHistoryPanel from './roll/containers/roll-history-panel';

import styled from 'styled-components/macro';


//* Main page component. */
export function App(props: {}) {
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

const Page = styled.div`
    border-radius: 0;
`;

const AppHeader = styled.header`
    background-color: #222;
    height: 4em;
    padding: 0.9em;
    color: white;
`;

const AppTitle = styled.h1`
    font-size: 2em;
    font-style: oblique;
    font-weight: 900;
    text-align: center;
`;

export default function App2(props: {}) {
    return (
        <Page>
            <AppHeader className="mb-2">
                <AppTitle>Shadowroller</AppTitle>
            </AppHeader>
            <div className="App-wide-container">
                <RollInputPanel />
                <RollHistoryPanel />
            </div>
        </Page>
    );
}
