import React from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

import { applyMiddleware, createStore, combineReducers } from 'redux';
import thunk from 'redux-thunk';

import rollReducer from './roll/reducers';

const appReducers = {
    roll: rollReducer
};
const appReducer = combineReducers(appReducers);

const middleware = [ thunk ];

const store = createStore(
    appReducer,
    applyMiddleware(...middleware)
);


ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root')
);
registerServiceWorker();
