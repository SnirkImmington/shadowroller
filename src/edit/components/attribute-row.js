// @flow

import './attribute-row.css';
import './edit-attributes.css';

import * as React from 'react';
import { FormGroup, ControlLabel } from 'react-bootstrap';
import NumericInput from '../../components/numeric-input';

import type { Attribute } from '../../data/attributes';
import * as util from '../../util';

type Props = {
    attr: Attribute,
    value: number,
    editable?: boolean,
    onChange: (Attribute, ?number) => void,
    children?: React.Node,
};

export default function AttributeRow(props: Props) {
    const controlId = `attribute-row-${props.attr}`;

    return (
        <FormGroup controlId={controlId}
                   className="attribute-panel-group">
            <ControlLabel className="attribute-row menu-label">
                {util.format(props.attr, 'title')}
            </ControlLabel>
            <NumericInput className='attribute-row-input'
                          controlId={controlId}
                          value={props.value} min={0} max={14}
                          onSelect={(val: ?number) =>
                              props.onChange(props.attr, val)} />
        </FormGroup>
    );
}
