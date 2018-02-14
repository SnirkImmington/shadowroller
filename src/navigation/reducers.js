// @flow

import { combineReducers } from 'redux';

import type { Page } from '..';
import type { NavAction } from './actions';
import type { NavigationState } from './state';

import { DEFAULT_NAV_STATE } from './state';
import type { Action, ThunkAction } from '../state';

function pageReducer(page: Page = "skills", action: NavAction): Page {
    if (action.type === 'nav.select_page') {
        return action.page;
    }
    else {
        return page;
    }
}

const navReducers: { [$Keys<NavigationState>]: (any, NavAction) => any } = {
    page: pageReducer
};

const navReducer: (NavigationState, NavAction | ThunkAction) => NavigationState
    = combineReducers(navReducers);

export default navReducer;
