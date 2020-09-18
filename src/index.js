// @flow

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

if (process.env.NODE_ENV !== 'production') {
    document.title = `Shadowroller (${process.env.NODE_ENV})`;
}

ReactDOM.render(
    (
        <React.StrictMode>
            <App />
        </React.StrictMode>
    ),
    document.getElementById('root')
);
serviceWorker.unregister();
