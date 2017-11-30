// @flow

import * as React from 'react';
import { Panel, Pagination } from 'react-bootstrap';
import { connect } from 'react-redux';
import { FavorText } from '../../components';

import CountHitsRecord from '../components/outcomes/count-hits';
import RollAgainstRecord from '../components/outcomes/roll-against';
import TestForRecord from '../components/outcomes/test-for';
import DisplayRecord from '../components/outcomes/display';

// These imports are used in Flow asserts.
import RollResult from '../result/roll-result'; //eslint-disable-line no-unused-vars
import CountHitsResult from '../result/count-hits'; //eslint-disable-line no-unused-vars
import TestForResult from '../result/test-for'; //eslint-disable-line no-unused-vars
import RollAgainstResult from '../result/roll-against'; //eslint-disable-line no-unused-vars
import typeof RollOutcome from '../result';

import { DEFAULT_ROLL_STATE } from '../../state';
import type { AppState, DispatchFn } from '../../state';
import * as rollActions from '../actions';

const PAGE_LENGTH: number = 5;

const DO_SOME_ROLLS_FAVORTEXT: string[] = [
    "Roll some dice!",
    "Do some rolls!",

    "Have at em, chummer.",
    "You have to press the roll dice button, chummer.",
    "Roll some glitches.",
];

type Props = {
    dispatch: DispatchFn,
    outcomes: Array<RollOutcome>,
    outcomePage: number
};

/** Displays the given rolls. */
class RollHistoryPanel extends React.Component<Props> {
    onRecordClosed = (index: number) => {
        const newMaxPage = Math.ceil((this.props.outcomes.length - 1) / PAGE_LENGTH);
        this.props.dispatch(rollActions.deleteOutcome(index));
        if (newMaxPage > this.props.outcomePage) {
            this.props.dispatch(rollActions.selectPage(newMaxPage));
        }
    }

    handlePageSelect = (page: number) => {
        console.log("Selected page", page);
        this.props.dispatch(rollActions.selectPage(page));
    }

    render() {
        const outcomesLength = this.props.outcomes.length;
        const maxPages = Math.ceil(outcomesLength / PAGE_LENGTH);
        let outcomes: Array<RollOutcome>;

        if (outcomesLength <= PAGE_LENGTH) {
            outcomes = this.props.outcomes;
        }
        else {
            const start = (this.props.outcomePage - 1) * PAGE_LENGTH;
            outcomes = this.props.outcomes.slice(start, start + PAGE_LENGTH);
        }

        const entries = outcomes.entries();
        const header = (
            <span className="roll-history-panel-header">
                <b>Roll results</b>
            </span>
        );

        const result: Array<React.Node> = [];
        for (const entry of entries) {
            const index: number = entry[0];
            const outcome: any = entry[1];

            if (outcome.mode === 'count-hits') {
                result.push(
                    <CountHitsRecord key={index}
                                     recordKey={index}
                                     onClose={this.onRecordClosed}
                                     outcome={outcome} />
                );
            }
            else if (outcome.mode === 'roll-against') {
                result.push(
                    <RollAgainstRecord key={index}
                                       recordKey={index}
                                       onClose={this.onRecordClosed}
                                       outcome={outcome} />
                );
            }
            else if (outcome.mode === 'test-for') {
                result.push(
                    <TestForRecord key={index}
                                   recordKey={index}
                                   onClose={this.onRecordClosed}
                                   outcome={outcome} />
                );
            }
            else if (outcome.mode === 'display') {
                result.push(
                    <DisplayRecord key={index}
                                     recordKey={index}
                                     onClose={this.onRecordClosed}
                                     outcome={outcome} />
                );
            }
        }

        return (
            <Panel id="roll-history-panel"
                   header={header}
                   bsStyle="info">
                {result}
                {outcomesLength === 0 ?
                    <FavorText from={DO_SOME_ROLLS_FAVORTEXT} />
                : outcomesLength > PAGE_LENGTH ?
                    <Pagination id="roll-history-pagination"
                            first prev next
                            maxButtons={5}
                            items={maxPages}
                            activePage={this.props.outcomePage}
                            onSelect={this.handlePageSelect} />
                : ""}
            </Panel>
        )
    }
}

function mapStateToProps(state: AppState) {
    return {
        outcomes: state.roll.outcomes || DEFAULT_ROLL_STATE.outcomes,
        outcomePage: state.roll.outcomePage || 1
    };
}

export default connect(mapStateToProps)(RollHistoryPanel);
