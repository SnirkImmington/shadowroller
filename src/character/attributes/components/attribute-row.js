// @flow

import '../containers/attribute-panel.css';

import * as React from 'react';
import {
    FormGroup, ControlLabel, FormControl,
} from 'react-bootstrap';
import NumericInput from '../../../components/numeric-input';

import { ATTRIBUTES } from '../index';
import type { Attribute } from '../index';

type Props = {
    attr: Attribute,
    value: number,
    editable?: boolean,
    onChange?: (Attribute, ?number) => void,
    children?: React.Node,
};

function empty(attr: Attribute, num: ?number) { }

export default function AttributeRow(props: Props) {
    const onChange = props.onChange || empty;
    if (props.editable) {
        return (
            <FormGroup controlId={"attribute-row-" + props.attr}
                       className="attribute-panel-group">
                <ControlLabel className="attribute-row menu-label">
                    {ATTRIBUTES[props.attr].full}
                </ControlLabel>
                <NumericInput className='attribute-row-input'
                              value={props.value} min={0} max={14}
                              onSelect={(val: ?number) =>
                                  onChange(props.attr, val)} />
            </FormGroup>
        );
    }
    else {
        return (
            <FormGroup controlId={"attribute-row-" + props.attr}
                       className="attribute-panel-group">
                <ControlLabel classname="attribute-row menu-label">
                        {ATTRIBUTES[props.attr].full}
                </ControlLabel>
                <FormControl disabled type="text"
                             className="numeric-input-disabled"
                             value={props.value}
                             onChange={() => {}} />
                {props.children}
            </FormGroup>
        );
    }
}
