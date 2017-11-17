// @flow

import './random-loading-label.css';

import React, { Component } from 'react';
import { ControlLabel } from 'react-bootstrap';

import pickRandom from '../../util/pick-random';

const loadingFlavorText: string[] = [
    "Getting all the best rolls",

    "Monkey tacos! I'm so random",
    "Something something randomizing",
    "Potato potato shadow run stuff",

    "Using non-heat-based randomess",
    "Setting up the horse races",
    "Not fixing the horse races",
    "Don't get your locks melted off",
    "Fetching b0ss a critical glitch",

    "Preconfiguring the glitches",
    "Asking the dragons for rolls",

    "Just a second, chummer",
    "Place your bets, chummer",

    "Fetching your ediquitte checks",
    "Fetching the most critical of glitches",
    "Fetching a few misses",

    "Maybe you'll get some hits this time",
    "You may as well turn back now",
    "Here, have some glitches",
];

const loadedFlavorText: string[] = [
    "Rolls from random.org",
    "Rolls from random.org",
    "Rolls from random.org",
    "Rolls from random.org",

    "Randomness from random.org",
    "Fairness from random.org",

    "Misses from random.org",
    "Glitches from random.org",
    "Hits from random.org",
    "Curses and madness from random.org",

    "Go get 'em, chummer",
];

type LoadingProps = { isLoading: boolean };

export default class RandomLoadingLabel extends Component<LoadingProps> {

    shouldComponentUpdate(nextProps: LoadingProps) {
        return nextProps.isLoading !== this.props.isLoading;
    }

    render() {
        if (this.props.isLoading) {
            const flavorText = pickRandom(loadingFlavorText);
            return (
                <ControlLabel className="roll-loading-label roll-menu-label">
                    <span className="dice-roll-icon roll-menu-icon" />
                    <i>{flavorText}...</i>
                </ControlLabel>
            );
        }
        else {
            const flavorText = pickRandom(loadedFlavorText);
            return (
                <ControlLabel className="roll-loading-label">
                    <i>{flavorText}</i>
                </ControlLabel>
            );
        }
    }
}
