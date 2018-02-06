// @flow

import * as React from 'react';
import {
    Panel, Form
} from 'react-bootstrap';
import { connect } from 'react-redux';

import type { DispatchFn, AppState } from '../../state';

type Props = {
    dispatch: DispatchFn,
    state: AppState,
};

class EditSkills extends React.Component<Props> {
    render() {
        return (
            <Panel header={<b>Edit Skills</b>}
                   className="edit-skills-panel">

            </Panel>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        state
    };
}

export default connect(mapStateToProps)(EditSkills);
