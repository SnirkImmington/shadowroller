// @flow

import './random-loading-label.css';

import React, { Component } from 'react';
import { ControlLabel } from 'react-bootstrap';

import { connect } from 'react-redux';

import type { LoadingState } from '../state';
import type { AppState, DispatchFn, GetStateFn } from '../../state';
import * as rollActions from '../actions';
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

const localRequiredFlavorText: string[] = [
    "Can't access random.org",
    "random.org is offline",
    "Can't find random.org on the Matrix",
    "Too much noise to access random.org",
    "Unable to find random.org's host",
];

const localLoadingFlavorText: string[] = [
    "Getting randoness from your browser",
    "Hope your browser has good RNG",
    "Your browser better be random enough, chummer",
];

const localLoadedFlavorText: string[] = [
    "Rolls from Random.next()",
    "Rolls from your browser",
    "Pseudorandom rolls from your browser",
    "Pseudorandom rolls from your browser",
    "Pseudorandom rolls from your browser",
    "Possibly-compromised rolls from your browser",

    "Rolling in offline mode",
    "Rolling without wireless bonus",
];

type Props = {|
    dispatch: DispatchFn,
    getState: GetStateFn,

    bufferLoadState: LoadingState,
    isLocal: boolean,
|};

class RandomLoadingLabel extends Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
        return nextProps.bufferLoadState !== this.props.bufferLoadState
            || nextProps.isLocal !== this.props.isLocal;
    }

    handleFillLocal = (event: SyntheticInputEvent<HTMLButtonElement>) => {
        this.props.dispatch(rollActions.bufferSetLocal(true));
        this.props.dispatch(rollActions.fetchBuffer());
    }

    handleGoWireless = (event: SyntheticInputEvent<HTMLButtonElement>) => {
        this.props.dispatch(rollActions.clearBuffer());
        this.props.dispatch(rollActions.bufferSetLocal(false));
        this.props.dispatch(rollActions.fetchBuffer());
    }

    render() {
        if (this.props.bufferLoadState === "failed") {
            const flavorText = pickRandom(localRequiredFlavorText);
            return (
                <span className="loading-label-with-link roll-loading-label">
                    <ControlLabel className="roll-menu-label"
                                  controlId="roll-input-local-buffer">
                        {flavorText}
                    </ControlLabel>
                    {" ("}
                    <a href="#roll-input-panel"
                       onClick={this.handleFillLocal}>
                        Use local RNG
                    </a>)
                </span>
            );
        }
        else if (this.props.bufferLoadState === "loading") {
            const flavorText = this.props.isLocal ?
             pickRandom(localLoadingFlavorText) : pickRandom(loadingFlavorText);
            return (
                <ControlLabel className="roll-loading-label roll-menu-label">
                    <span className="dice-roll-icon roll-menu-icon" />
                    <i>{flavorText}...</i>
                </ControlLabel>
            );
        }
        else {
            if (this.props.isLocal) {
                const flavorText = pickRandom(localLoadedFlavorText);
                return (
                    <span className="roll-loading-label">
                        <ControlLabel className="roll-menu-label"
                                      controlId="roll-input-random-buffer">
                            {flavorText}
                        </ControlLabel>
                        {" ("}
                        <a href="#roll-input-panel"
                           onClick={this.handleGoWireless}>
                            Use random.org
                        </a>)
                    </span>
                )
            }
            else {
                const flavorText = pickRandom(loadedFlavorText);
                return (
                    <ControlLabel className="roll-loading-label roll-menu-label">
                        {flavorText}
                    </ControlLabel>
                );
            }
        }
    }
}

function mapStateToProps(state: AppState) {
    return {
        bufferLoadState: state.roll.bufferLoadState || "loading",
        isLocal: state.roll.bufferIsLocal || false,
    };
}

export default connect(mapStateToProps)(RandomLoadingLabel);
