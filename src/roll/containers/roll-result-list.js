// @flow

import * as React from 'react';
import { connect } from 'react-redux';
import typeof RollOutcome from '../result';

import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import { DEFAULT_ROLL_STATE } from '../../state';
import type { AppState, DispatchFn } from '../../state';
import * as rollActions from '../actions';

import RollRecord from '../components/outcomes/roll-record';

type Props = {
    dispatch: DispatchFn,
    showNumbers: bool,
    outcomes: Array<RollOutcome>;
};

type RowRenderProps = {
    style: any,
    index: number,
};

function RollResultsList(props: Props) {
    const { outcomes, showNumbers } = props;

    const listRef = React.useRef();

    function onClose(id: number) {
        props.dispatch(rollActions.deleteOutcome(id));
    }

    /*
    function handleItemAppended() {
        listRef.current.scrollToItem(this.props.outcomes.length -1, 'end');
    }

    function handleItemHighlighted(index: number) {
        listRef.current.scrollToItem(index);
    }
    */

    function renderRow(props: RowRenderProps) {
        const outcome : RollOutcome = outcomes[props.index];
        return (
            <div className="rollresultwrapper" style={props.style}>
                <RollRecord index={props.index}
                            outcome={outcome}
                            showNumbers={showNumbers}
                            onClose={onClose} />
            </div>
        );
    }

    return (
        <AutoSizer>
            { ({height, width}) => (
                <List className="row-results-list"
                      ref={listRef}
                      height={height} width={width}
                      itemCount={outcomes.length}
                      itemSize={140}>
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
