// @flow

import { combineReducers } from 'redux';

import AttributesReducer from './attributes/reducers';

const characterReducer = combineReducers({
    attributes: AttributesReducer,
})

export default characterReducer;
