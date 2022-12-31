import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = document.getElementById("root");

if (process.env.NODE_ENV !== 'production') {
    document.title = `Shadowroller (${process.env.NODE_ENV})`;
    ReactDOM.createRoot(root!)
        .render(<React.StrictMode><App /></React.StrictMode>);
}
else {
    ReactDOM.hydrateRoot(root!, <App />);
}
