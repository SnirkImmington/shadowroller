// @flow

import type { Page } from '.';

export type SelectPageAction = {
    +type: "nav.select_page",
    +page: Page
};

export function selectPage(page: Page) {
    return { type: "nav.select_page", page };
}

export type NavAction =
| SelectPageAction
;
