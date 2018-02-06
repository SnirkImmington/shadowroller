// @flow

import * as React from 'react';
import { Panel } from 'react-bootstrap';

import AttributeRow from './attribute-row';

import { connect } from 'react-redux';
import type { DispatchFn, AppState } from '../../state';

import type { Attribute } from '../../data/attributes';
import type { CharacterState, AttributesState } from '../../character/state';

type Props = {
    dispatch: DispatchFn,
    attributes: AttributesState,
};

class EditAttributes extends React.Component<Props> {
    handleAttrChange = (attr: Attribute, newVal: ?number) => {
        if (newVal != null) {
            //this.props.dispatch();
        }
    }

    render() {
        const attrs = this.props.attributes;
        const header = <b>Edit Attributes</b>;
        let rows = [];
        console.log("Attributes:", attrs);
        for (const attr: Attribute of Object.keys(attrs)) {
            console.log(attr, ": ", attrs[attr]);
            const value = attrs[attr];
            rows.push(
                <AttributeRow attr={attr} value={value || 1}
                              onChange={this.handleAttrChange} />
            );
        }

        return (
            <Panel header={header} id="edit-attributes-panel">
                <form id="edit-attributes-form" onSubmit={() => {}}>
                    {rows}
                </form>
            </Panel>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        attributes: state.character.attributes
    };
}

export default connect(mapStateToProps)(EditAttributes);
