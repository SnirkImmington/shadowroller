// @flow

import * as React from 'react';
import * as UI from 'style';

const MINUTE = 60,
      HOUR = MINUTE * 60,
      DAY = HOUR * 24,
      WEEK = DAY * 7;

const HOUR_FORMAT = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
const WEEK_DAY = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const MONTH_FORMAT = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
    timeStyle: "short", dateStyle: "medium"
});

export function since(ts: Date, now: Date = new Date()): string {
    // Get delta of timestamps in seconds
    const delta = Math.round((now.valueOf() - ts.valueOf()) / 1000);
    if (delta < DAY) {
        return HOUR_FORMAT.format(ts);
    }
    if (delta < 2 * DAY) {
        return `Yesterday ${HOUR_FORMAT.format(ts)}`;
    }
    if (delta < WEEK) {
        return `${WEEK_DAY.format(ts)} at ${HOUR_FORMAT.format(ts)}`;
    }
    if (delta < 2 * WEEK) {
        return `Last ${WEEK_DAY.format(ts)} at ${HOUR_FORMAT.format(ts)}`;
    }
    if (ts.getFullYear() === now.getFullYear()) {
        return `${MONTH_FORMAT.format(ts)} at ${HOUR_FORMAT.format(ts)}`;
    }
    return DATE_FORMAT.format(ts);
}

export function Since({ date }: { date: Date }) {
    const dateText = since(date);
    return (
        <UI.SmallText>
            {dateText ?
                <time dateTime={date.toISOString()}>{dateText}</time>
                : "At some point"}
        </UI.SmallText>
    );
}
