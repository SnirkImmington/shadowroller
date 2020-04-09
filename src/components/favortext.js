// @flow

import * as React from 'react';

import { pickRandom } from 'srutil';

type Props = {
    from: React.Node[]
};

/**
Picks some flavor text from a list.

More importantly, doesn't change flavor text every time React goes to
re-render it.

The list MUST be a single-reference const (do not construct lists on the fly).
*/
export default class FavorText extends React.Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
        // Don't construct lists on the fly.
        return nextProps.from !== this.props.from;
    }

    render() {
        const text = pickRandom(this.props.from);

        return <span className="favortext">{text}</span>;
    }
}
