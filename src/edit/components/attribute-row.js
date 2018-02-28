// @flow

import './attribute-row.css';
import './edit-attributes.css';

import * as React from 'react';
import { FormGroup, FormControl, ControlLabel } from 'react-bootstrap';

import type { Attribute } from '../../data/attributes';
import * as util from '../../util';

import { ALL_ATTRIBUTES } from '../../data/attributes';

type Props = {
    attr: Attribute,
    value: number,
    editable?: boolean,
    onChange: (Attribute, ?number) => void,
    children?: React.Node,
};

export default function AttributeRow(props: Props) {
    const controlId = `attribute-row-${props.attr}`;

    function handleChange(event: SyntheticInputEvent<HTMLInputElement>) {
        console.log("Change event from attrRow:", event.target.value);
        props.onChange(props.attr, event.target.valueAsNumber || 0);
    }

    return (
        <FormGroup controlId={controlId}
                   className="attribute-panel-group">
            <ControlLabel className="attribute-row menu-label">
                {util.format(props.attr, 'title')}
            </ControlLabel>
            <FormControl className='attribute-row-input'
                          type="number"
                          min={ALL_ATTRIBUTES[props.attr]["default"]}
                          max={ALL_ATTRIBUTES[props.attr].max || 14}
                          id={controlId}
                          value={props.value}
                          onChange={handleChange} />
        </FormGroup>
    );
}
