// @flow

import './attribute-panel.css';

import * as React from 'react';
import { Panel } from 'react-bootstrap';

import { connect } from 'react-redux';

import AttributeRow from '../components/attribute-row';

import { ATTRIBUTES } from '..';
import type { Attribute } from '..';
import type { AttributesState } from '../state';
import * as attributeActions from '../actions';

import type { CharacterState } from '../../state';

import type { AppState, DispatchFn } from '../../../state';
import { DEFAULT_ATTRIBUTES_STATE } from  '../state';

type Props = {
    editable?: boolean,
    dispatch: DispatchFn,
    attributes: AttributesState,
};

class AttributePanel extends React.Component<Props> {
    handleAttrChange = (attr: Attribute, newVal: ?number) => {
        if (newVal != null) {
            this.props.dispatch(attributeActions.attributeChanged(attr, newVal));
        }
    }

    render() {
        const editable = this.props.editable || false;

        let header: React.Node;

        if (!editable) {
            header = (
                <abbr title="Edit your attributes in the Character tab.">
                    Attributes
                </abbr>
            );
        }
        else {
            header = (
                <abbr title="Character's attributes.">
                    <b>Attributes</b>
                </abbr>
            )
        }

        const rows: React.Node[] = [];
        for (const attr: Attribute of Object.keys(ATTRIBUTES)) {
            const value = this.props.attributes[attr];
            if (value === 0) { continue; }

            if (editable) {
                rows.push(
                    <AttributeRow editable attr={attr} value={value || 1}
                                  onChange={this.handleAttrChange} />
                );
            }
            else {
                rows.push(
                    <AttributeRow attr={attr}
                                  value={this.props.attributes[attr] || 1} />
                );
            }
        }
        return (
            <Panel header={header} id='attribute-panel'>
                <form id="attribute-panel-form"
                      onSubmit={() => {}}>
                    {rows}
                </form>
            </Panel>
        );
    }
}

function mapStateToProps(state: CharacterState) {
    return {
        attributes: state.attributes || DEFAULT_ATTRIBUTES_STATE,
    };
}

export default connect(mapStateToProps)(AttributePanel);
