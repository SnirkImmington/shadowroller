import React from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';

import { applyMiddleware, createStore, combineReducers } from 'redux';
import { createLogger } from 'redux-logger';
import thunk from 'redux-thunk';

import rollReducer from './roll/reducers';
import characterReducer from './character/reducers';

const appReducer: (any) => any = combineReducers({
    roll: rollReducer,
    attributes: characterReducer,
});

const middleware: any[] = [ thunk ];
if (process.env.NODE_ENV !== "production") {
    middleware.push(createLogger());
}

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
