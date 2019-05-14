// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import typeof RollOutcome from '../result';

import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { DEFAULT_ROLL_STATE } from '../../state';
import type { AppState, DispatchFn } from '../../state';
import type { RollMode } from '..';
import * as rollActions from '../actions';

import RollRecord from '../components/outcomes/roll-record';
import CountHitsRecord from '../components/outcomes/count-hits';
import TestForRecord from '../components/outcomes/test-for';
import RollAgainstRecord from '../components/outcomes/roll-against';


type Props = {
    dispatch: DispatchFn,
    outcomes: Array<RollOutcome>;
};

type RowRenderProps = {
    style: any,
    index: number,
};

function RollResultsList(props) {
    const outcomes = props.outcomes;

    function onClose(input: number) {
        props.dispatch(rollActions.deleteOutcome(input));
    }

    function renderRow(props: RowRenderProps) {
        const outcome = outcomes[props.index];
        return (
            <div className="rollresultwrapper" stle={props.style}>
                <RollRecord index={props.index}
                            outcome={outcome}
                            onClose={onClose} />
            </div>
        );
    }

    return (
        <AutoSizer>
            { ({height, width}) => (
                <List className="row-results-list"
                      height={height} width={width}
                      itemCount={outcomes.length}
                      itemSize={100}>
                    {renderRow}
                </List>
            ) }
        </AutoSizer>
    )
}


function mapStateToProps(state: AppState) {
    return {
        outcomes: state.roll.outcomes || DEFAULT_ROLL_STATE.outcomes,
    }
}

export default connect(mapStateToProps)(RollResultsList);
