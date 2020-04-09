// @flow

import './random-loading-label.css';

import * as React from 'react';

import { connect } from 'react-redux';

import type { LoadingState } from 'roll/state';
import type { AppState, DispatchFn, GetStateFn } from 'state';
import * as rollActions from 'roll/actions';
import { pickRandom } from 'srutil';

console.log('PickRandom: ', pickRandom);

const loadingFlavorText: React.Node[] = [
    "Getting all the best rolls",
    "Retrieving critical glitches",

    <span>
        Monkey tacos! I'm{" "}
        <span className="text-monospace">
            so
        </span>{" "}
        random
    </span>,
    "Something something randomizing",
    "Potato potato shadow run stuff",

    "Using non-heat-based randomess",
    "Setting up the horse races",
    "Not fixing the horse races",
    "Don't get your locks melted off",
    <span>
        Fetching{" "}
        <span className="text-monospace">
            b0ss
        </span>{" "}
        a critical glitch
    </span>,
    "Getting roll data from some guy on JackPoint",
    "Escorting an Aztech package full of rolls",

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

const loadedFlavorText: React.Node[] = [
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
];

const localRequiredFlavorText: React.Node[] = [
    "Can't access random.org",
    "random.org is offline",
    "Can't find random.org on the Matrix",
    "Too much noise to access random.org",
    "Unable to find random.org's Host",
];

const localLoadingFlavorText: React.Node[] = [
    "Getting randoness from your browser",
    "Hope your browser has good RNG",
    "Your browser better be random enough, chummer",
    "I hope your browser is random enough",
];

const localLoadedFlavorText: React.Node[] = [
    <span>
        Rolls from{" "}
        <span className="text-monospace">
            Random.next()
        </span>
    </span>,
    "Rolls from your browser",

    "Rolling in offline mode",
    "Rolling without Wireless bonus",
];

type Props = {|
    dispatch: DispatchFn,
    getState: GetStateFn,

    bufferLoadState: LoadingState,
    isLocal: boolean,
|};

class RandomLoadingLabel extends React.Component<Props> {
    shouldComponentUpdate(nextProps: Props) {
        return nextProps.bufferLoadState !== this.props.bufferLoadState
            || nextProps.isLocal !== this.props.isLocal;
    }

    handleFillLocal = (event: SyntheticInputEvent<HTMLButtonElement>) => {
        event.preventDefault();
        this.props.dispatch(rollActions.bufferSetLocal(true));
        this.props.dispatch(rollActions.fetchBuffer());
    }

    handleGoWireless = (event: SyntheticInputEvent<HTMLButtonElement>) => {
        event.preventDefault();
        this.props.dispatch(rollActions.clearBuffer());
        this.props.dispatch(rollActions.bufferSetLocal(false));
        this.props.dispatch(rollActions.fetchBuffer());
    }

    render() {
        if (this.props.bufferLoadState === "failed") {
            const flavorText = pickRandom(localRequiredFlavorText);
            return (
                <React.Fragment>
                    <label htmlFor="roll-button-submit">
                        {flavorText}
                    </label>
                    <div className="col-sm d-lg-none"></div>
                    {" ("}
                    <button id="roll-use-local"
                            type="button"
                            className="btn btn-link mx-0 px-0"
                            onClick={this.handleFillLocal}>
                        Use local RNG
                    </button>
                    )
                </React.Fragment>
            );
        }
        else if (this.props.bufferLoadState === "loading") {
            const flavorText = this.props.isLocal ?
             pickRandom(localLoadingFlavorText) : pickRandom(loadingFlavorText);
            return (
                <div className="row pr-lg-2 my-lg-auto justify-content-center">
                    <span className="dice-roll-icon" />
                    <i className="my-auto">
                        {flavorText}...
                    </i>
                </div>
            );
        }
        else {
            if (this.props.isLocal) {
                const flavorText = pickRandom(localLoadedFlavorText);
                return (
                    <React.Fragment>
                        <label htmlFor="roll-use-random-dot-org">
                            {flavorText}
                        </label>
                        {" ("}
                        <button id="roll-use-random-dot-org"
                                class="btn btn-link mx-0 px-0"
                                onClick={this.handleGoWireless}>
                            Use random.org
                        </button>)
                    </React.Fragment>
                );
            }
            else {
                const flavorText = pickRandom(loadedFlavorText);
                return (
                    <label htmlFor="roll-button-submit">
                        {flavorText}
                    </label>
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
