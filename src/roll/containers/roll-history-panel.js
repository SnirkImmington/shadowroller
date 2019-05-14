// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import { FixedSizeList } from 'react-window';

import { FavorText } from '../../components';
import RollResultList from './roll-result-list';

import typeof RollOutcome from '../result';

import { DEFAULT_ROLL_STATE } from '../../state';
import type { AppState, DispatchFn } from '../../state';
import type { RollMode } from '..';
import * as rollActions from '../actions';

const PAGE_LENGTH: number = 6;

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
class RollHistoryPanel extends React.Component<Props> {
    render() {
        return (
            <div className="card mt-3">
                <div className="card-header bg-secondary text-white text-center">
                    <b>Roll Results</b>
                </div>
                <div className="card-body" style={{height: '400px'}}>
                    {this.props.outcomes.length === 0 ?
                        <div className="text-center">
                            <FavorText from={DO_SOME_ROLLS_FAVORTEXT} />
                        </div>
                    :
                        <RollResultList />
                    }
                </div>
            </div>
        )
    }
}

function mapStateToProps(state: AppState) {
    return {
        outcomes: state.roll.outcomes || DEFAULT_ROLL_STATE.outcomes,
    };
}

export default connect(mapStateToProps)(RollHistoryPanel);
