import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './index.css';
import App from './App';

const root = document.getElementById("root");

if (process.env.NODE_ENV !== 'production') {
    document.title = `Shadowroller (${process.env.NODE_ENV})`;
    ReactDOM.render(
        <React.StrictMode><App /></React.StrictMode>,
        root
    );
}
else {
    ReactDOM.hydrate(<App />, root);
}
