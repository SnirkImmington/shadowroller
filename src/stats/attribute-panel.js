// @flow

import React, { Component } from 'react';
import {
    Panel, Col, Row, Grid,
    FormGroup, ControlLabel, FormControl
} from 'react-bootstrap';
import NumericInput from '../components/numeric-input';

import { Attributes } from '../attributes';
import type { AttributeType } from '../attributes';

import '../App.css';
import '../attributes/containers/attribute-panel.css';
import * as data from './data/stats.json';

type Props = {
    editable: boolean,
};

type State = {
    attributeValues: Map<AttributeType, number>;
};

export default class AttributePanel extends Component<Props, State> {
    handleFormSubmit: Function;
    createFormGroup: Function;

    constructor(props: Props) {
        super(props);

        const attributeValues = new Map();

        for (const attr in Attributes) {
            attributeValues.set(attr, 0);
        }

        this.state = {
            attributeValues: attributeValues
        };
        this.handleFormSubmit = this.handleFormSubmit.bind(this);
        this.createFormGroup = this.createFormGroup.bind(this);
    }

    handleAttrChanged(attr: AttributeType, value: any) {

    }

    handleFormSubmit(event: SyntheticInputEvent<HTMLInputElement>) {

    }

    createFormGroup(attr: AttributeType, value: number): any {
        function handleChange(number: ?number) {
            //attrPanel.props.onAttributeChange(attr, number);
        }
        return (
            <FormGroup controlId={attr + "Select"}
                       className="attribute-panel-group padded-bottom">
                <ControlLabel className='attribute-panel-name roll-menu-label'>
                    {Attributes[attr].full}
                </ControlLabel>
                <NumericInput className='attribute-panel-input'
                              disabled={!this.props.editable}
                              value={value} min={0} max={6}
                              onSelect={handleChange} />
            </FormGroup>
        )
    }

    render() {
        const title = <b>Attributes</b>;

        const attributeItems = [];
        for (const [key, value] of this.state.attributeValues) {
            attributeItems.push(this.createFormGroup(key, value));
        }

        return (
            <Panel id="attribute-panel"
                   header={title}>
               <form id="attribute-panel-form"
                     onSubmit={this.handleFormSubmit}>
                    {attributeItems}
                </form>
            </Panel>
        )
    }
}
