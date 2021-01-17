// @flow

import * as React from 'react';
import * as UI from 'style';

export const Loading = React.memo<{}>(React.forwardRef(function LoadingIndicator(props, ref) {
    return (
        <span ref={ref}>Getting some rolls... <UI.DiceSpinner /></span>
    );
}));
