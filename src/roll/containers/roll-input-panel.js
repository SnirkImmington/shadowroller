// @flow

import '../../App.css';

import * as React from 'react';
import { connect } from 'react-redux';

import NumericInput from '../../components/numeric-input';
import RandomLoadingLabel from '../components/random-loading-label';

import RollModeSelector from './options/roll-mode-selector';
import TestForOptions from './options/test-for';
import RollAgainstOptions from './options/roll-against';

import type { RollMode } from '../index';

import { DEFAULT_ROLL_STATE } from '../../state';
import type { RollState } from '../state';
import { propertiesSet, diceAvailable } from '../state';
import type {
    AppState, DispatchFn,
} from '../../state';
import * as rollActions from '../actions';

type Props = {
    dispatch: DispatchFn,
    state: RollState, // Given by `mapStateToProps`.
};

/** Base class for roll options input. */
class RollInputPanel extends React.Component<Props> {
    handleRollSubmit = (event: SyntheticInputEvent<HTMLButtonElement>) => {
        event.preventDefault();
        this.props.dispatch(rollActions.performRoll());
    }

    componentDidMount() {
        // First try at fetching from remote buffer.
        this.props.dispatch(rollActions.fetchBuffer());
    }

    handleDiceChange = (dice: ?number) => {
        if (dice != null && dice < 100 && dice > 0) {
            this.props.dispatch(rollActions.setDiceCount(dice));
        }
        else {
            this.props.dispatch(rollActions.setDiceCount(null));
        }
    }

    handleRollModeSelect = (mode: RollMode) => {
        this.props.dispatch(rollActions.setRollMode(mode));
    }

    handleTestForSelect = (testFor: ?number) => {
        if (testFor != null && testFor > 0) {
            this.props.dispatch(rollActions.setTestFor(testFor));
        }
        else {
            this.props.dispatch(rollActions.setTestFor(null));
        }
    }

    handleRollAgainstSelect = (rollAgainst: ?number) => {
        if (rollAgainst != null && rollAgainst < 100 && rollAgainst > 0) {
            this.props.dispatch(rollActions.setRollAgainst(rollAgainst));
        }
        else {
            this.props.dispatch(rollActions.setRollAgainst(null));
        }
    }

    getRollOptions = (mode: RollMode): React.Node => {
        const state = this.props.state;
        if (mode === 'count-hits') {
            return "";
        }
        else if (mode === "test-for") {
            return <TestForOptions value={state.testForDice}
                                   onChange={this.handleTestForSelect} />;
        }
        else if (mode === "roll-against") {
            return <RollAgainstOptions value={state.rollAgainstDice}
                                       onChange={this.handleRollAgainstSelect} />;
        }
        else {
            return "";
        }
    }

    componentWillUpdate = (nextProps: Props) => {
        let isReady = (nextProps.state.bufferLoadState === "complete") && propertiesSet(nextProps.state);
        if (isReady && !diceAvailable(nextProps.state)) {
            nextProps.dispatch(rollActions.fetchBuffer());
        }
    }

    render = () => {
        const state = this.props.state;
        let isReady = (state.bufferLoadState !== "loading") && propertiesSet(state);
        if (isReady && !diceAvailable(state)) {
            isReady = false;
        }

        const options = this.getRollOptions(state.selectedRollMode);

        const rollDiceControl = (
            <div className="row">
                <div className="col-12 col-lg-auto my-lg-auto pr-lg-0">
                    Roll
                </div>
                <div className="col-12 col-lg-auto my-2 my-lg-auto">
                    <NumericInput controlId="roll-input-dice"
                                  min={1} max={100}
                                  onSelect={this.handleDiceChange} />
                </div>
                <div className="col-12 col-lg-auto my-lg-auto pl-lg-0">
                    dice
                </div>
                <div className="col-lg"></div>
            </div>
        );

        const selector = (
            <RollModeSelector selected={state.selectedRollMode}
                              onSelect={this.handleRollModeSelect} />
        );

        const rollButton = (
            <div className="row">
                <div className="col-lg"></div>
                <div className="col-12 col-lg-auto my-1 my-lg-auto">
                    <RandomLoadingLabel />
                </div>
                <div className="col-12 col-lg-auto">
                    <button id="roll-button-submit"
                            type="button"
                            className="btn btn-primary"
                            disabled={!isReady}
                            onClick={isReady ? this.handleRollSubmit : null}>
                        Roll dice
                    </button>
                </div>
            </div>
        );

        return (
            <div className="card mt-3">
                <div className="card-header bg-info text-white text-center">
                    <b>Roll dice</b>
                </div>
                <div className="card-body text-center">
                    <form id="roll-input-panel-form"
                          onSubmit={this.handleRollSubmit}>
                        <div className="container-flex">
                            <div className="row justify-content-xl-between">
                                <div className={options === "" ?
                                    "col-12 col-xl-4" : "col-12 col-lg-auto"}>
                                    {rollDiceControl}
                                </div>
                                <div className="col-12 col-lg-auto my-3 my-lg-auto">
                                    {selector}
                                </div>
                                <div className="col-12 col-lg-auto">
                                    {options}
                                </div>
                                <div className="col-12 col-lg-auto">
                                    {rollButton}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        state: state.roll || DEFAULT_ROLL_STATE,
    };
}

export default connect(mapStateToProps)(RollInputPanel);
