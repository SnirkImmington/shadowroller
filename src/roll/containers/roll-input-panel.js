// @flow

import '../../App.css';
import './roll-input-panel.css';

import * as React from 'react';
import { connect } from 'react-redux';

import NumericInput from '../../components/numeric-input';
import RandomLoadingLabel from '../components/random-loading-label';

import RollModeSelector from './options/roll-mode-selector';
import TestForOptions from './options/test-for';
import RollAgainstOptions from './options/roll-against';
import DisplayOptions from './options/display';

import type { RollMode, DisplayMode } from '../index';

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
        this.props.dispatch(rollActions.setTestFor(testFor));
    }

    handleRollAgainstSelect = (rollAgainst: ?number) => {
        if (rollAgainst != null && rollAgainst < 100 && rollAgainst > 0) {
            this.props.dispatch(rollActions.setRollAgainst(rollAgainst));
        }
        else {
            this.props.dispatch(rollActions.setRollAgainst(null));
        }
    }

    handleDisplayModeSelect = (mode: DisplayMode) => {
        this.props.dispatch(rollActions.setDisplayMode(mode));
    }

    getRollOptions = (mode: RollMode): React.Node => {
        const state = this.props.state;
        if (mode === 'count-hits') {
            return <div />;
        }
        else if (mode === "test-for") {
            return <TestForOptions value={state.testForDice}
                                   onChange={this.handleTestForSelect} />;
        }
        else if (mode === "roll-against") {
            return <RollAgainstOptions value={state.rollAgainstDice}
                                       onChange={this.handleRollAgainstSelect} />;
        }
        else if (mode === "display") {
            return <DisplayOptions mode={state.displayMode}
                                   onChange={this.handleDisplayModeSelect} />;
        }
        else {
            return <div />;
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

        return (
            <div className="card">
                <div className="card-header bg-info text-white">
                    <b>Roll dice</b>
                </div>
                <div className="card-body">
                <form id="roll-input-panel-form"
                      onSubmit={this.handleRollSubmit}>
                    <div className="form-group row">
                        <label htmlFor="roll-input-dice">
                            Roll
                        </label>
                        <NumericInput controlId="roll-input-dice"
                                      min={1} max={100}
                                      onSelect={this.handleDiceChange} />
                        <label htmlFor="roll-input-dice">
                            dice
                        </label>
                    </div>
                    <RollModeSelector selected={state.selectedRollMode}
                                      onSelect={this.handleRollModeSelect} />
                    {options}
                    <div className="form-group row">
                        <RandomLoadingLabel htmlFor="roll-button-submit" />
                        <button id="roll-button-submit"
                                className="btn btn-secondary"
                                disabled={!isReady}
                                onClick={isReady ? this.handleRollSubmit : null}>
                            Roll dice
                        </button>
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
