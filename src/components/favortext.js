// @flow

import React, { Component } from 'react';

import pickRandom from '../util/pick-random';

type Props = {
    from: string[]
};

/**
Picks some flavor text from a list.

More importantly, doesn't change flavor text every time React goes to
re-render it.
*/
export default class FavorText extends Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
        // So we could just give a flat "NO" but this is cheaper.
        // Also accounts for RandomLoadingLabel.
        return nextProps.from.length !== this.props.from.length;
    }

    render() {
        const text = pickRandom(this.props.from);

        return <p className="flavortext">{text}</p>;
    }
}
