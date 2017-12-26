// @flow

import '../../App.css';
import './roll-input-panel.css';

import * as React from 'react';
import {
    Panel,
    FormGroup,
    ControlLabel,
    Button
} from 'react-bootstrap';
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
        if (dice != null && dice < 99 && dice > 0) {
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
        this.props.dispatch(rollActions.setRollAgainst(rollAgainst));
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
        const title = (
            <span className='App-menu-panel-title'>
                <b>Roll dice</b>
            </span>
        );

        const state = this.props.state;
        let isReady = (state.bufferLoadState !== "loading") && propertiesSet(state);
        if (isReady && !diceAvailable(state)) {
            isReady = false;
        }

        const options = this.getRollOptions(state.selectedRollMode);

        return (
            <Panel id="roll-input-panel" header={title} bsStyle="primary">
                <form id="roll-input-panel-form"
                      onSubmit={this.handleRollSubmit}>
                    <FormGroup id='roll-input-dice-group'
                               controlId="roll-input-dice">
                        <ControlLabel className="menu-label">
                            Roll
                        </ControlLabel>
                        <NumericInput controlId="roll-input-dice"
                                      min={1} max={100}
                                      onSelect={this.handleDiceChange} />
                        <ControlLabel className="menu-label">
                            dice
                        </ControlLabel>
                    </FormGroup>
                    <RollModeSelector selected={state.selectedRollMode}
                                      onSelect={this.handleRollModeSelect} />
                    {options}
                    <FormGroup id='roll-input-submit-group'
                               controlId='roll-submit'>
                        <RandomLoadingLabel />
                        <Button id='roll-button-submit'
                                bsStyle="primary"
                                disabled={!isReady}
                                onClick={isReady ? this.handleRollSubmit : null}>
                            Roll dice
                        </Button>
                    </FormGroup>
                </form>
            </Panel>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        state: state.roll || DEFAULT_ROLL_STATE,
    };
}

export default connect(mapStateToProps)(RollInputPanel);
