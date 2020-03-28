// @flow

import * as React from 'react';
import { connect } from 'react-redux';

import { FavorText } from '../../components';
import RollResultList from './roll-result-list';

import typeof RollOutcome from '../result';

import { DEFAULT_ROLL_STATE } from '../../state';
import type { AppState, DispatchFn } from '../../state';

const DO_SOME_ROLLS_FAVORTEXT: string[] = [
    "You have to press the roll dice button first, chummer.",
    "You gotta roll those dice first.",
    "Hit that roll button and we'll show you the glitches.",
];

type Props = {
    dispatch: DispatchFn,
    outcomes: Array<RollOutcome>,
};

/** Displays the given rolls. */
function RollHistoryPanel(props: Props) {
    const { outcomes } = props;
    const [showNumbers, setShowNumbers] = React.useState(false);

    function showNumbersToggle(event: SyntheticInputEvent) {
        console.log('Show numbers toggle', event, event.target.checked);
        setShowNumbers(event.target.checked);
    }

    return (
        <div className="card mt-3">
            <div className="card-header bg-secondary text-white d-flex justify-content-between">
                <b className="mr-auto">Roll Results</b>
                <span className="ml-0">
                    <div className="form-check">
                        <input className="form-check-input"
                               type="checkbox"
                               value={showNumbers}
                               onChange={showNumbersToggle}
                               id="roll-results-show-numbers" />
                        <label className="form-check-label"
                               for="roll-results-show-numbers">
                            Show hit counts
                        </label>
                    </div>
                </span>
            </div>
            <div className="card-body" style={{height: '400px'}}>
                {outcomes.length === 0 ?
                    <div className="text-center">
                        <FavorText from={DO_SOME_ROLLS_FAVORTEXT} />
                    </div>
                :
                    <RollResultList showNumbers={showNumbers} />
                }
            </div>
        </div>
    );
}

function mapStateToProps(state: AppState) {
    return {
        outcomes: state.roll.outcomes || DEFAULT_ROLL_STATE.outcomes,
    };
}

export default connect(mapStateToProps)(RollHistoryPanel);
