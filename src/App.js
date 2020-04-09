// @flow

import './App.css';

import * as React from 'react';

import SRHeader from 'header';
import JoinGamePrompt from 'join-game-prompt';
import RollDicePrompt from 'roll-dice';
import RollInputPanel from 'roll/containers/roll-input-panel';
import RollHistoryPanel from 'roll/containers/roll-history-panel';

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
    border-radius: 0 !important;
`;

export default function App2(props: {}) {
    // Page should be a flexbox.
    return (
        <Page className="rounded-0">
            <SRHeader expanded={true} />
            <JoinGamePrompt />
            <RollDicePrompt />
            <div className="App-wide-container">
                <RollInputPanel />
                <RollHistoryPanel />
            </div>
        </Page>
    );
}
