// @flow

import type { Page } from '.';

/** Navigation state of the app. */
export type NavigationState = {
    +page: Page;
};

export const DEFAULT_NAV_STATE = {
    page: "edit"
};
