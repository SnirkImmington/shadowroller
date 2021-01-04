// @flow

import * as React from 'react';
import * as humanTime from 'humanTime';
import * as UI from 'style';

import * as Game from 'game';
import * as Event from 'history/event';

export const Loading = React.memo<{}>(React.forwardRef(function LoadingIndicator(props, ref) {
    return (
        <span ref={ref}>Getting some rolls... <UI.DiceSpinner /></span>
    );
}));
