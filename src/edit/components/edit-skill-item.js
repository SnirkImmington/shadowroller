// @flow

import './edit-skill-item.css';

import * as React from 'react';
import {
    ListGroupItem,
    ControlLabel, FormControl, FormGroup, Form, Button
} from 'react-bootstrap';

import type { Skill, SkillInfo } from '../../data/skills';
import format from '../../util/format';

type Props = {
    skill: Skill,
    info: SkillInfo,
    current: number,
    onChange: (Skill, number) => void
};

export default function EditSkillItem(props: Props) {
    const skillName = format(props.info.name || props.skill, 'title');
    const header = (
        <div className="edit-skill-item-header">
            <b>{skillName}</b>
            <Form inline id={`edit-skill-${props.skill}`}>
                <FormGroup controlId={`edit-skill-${props.skill}-old`}>
                    <ControlLabel>Old value:</ControlLabel>
                    <FormControl disabled
                                 className="old-skill-display"
                                 id={`edit-skill-${props.skill}-old`}
                                 value={props.current} />
                </FormGroup>
                <FormGroup controlId={`edit-skill-${props.skill}-set`}>
                    <ControlLabel>
                        New value:
                    </ControlLabel>
                    <FormControl id={`edit-skill-${props.skill}-set`}
                                 className="new-skill-input"
                                 type="number" min={0} max={14}
                                 onChange={(event: SyntheticInputEvent<HTMLInputElement>) => {
                                     props.onChange(props.skill,
                                         event.target.valueAsNumber);
                                 }} />
                </FormGroup>
                <Button id={`edit-skill-${props.skill}-submit`}>
                    Update
                </Button>
            </Form>
        </div>
    );
    return (
        <ListGroupItem eventKey={props.skill}>
            {header}
        </ListGroupItem>
    )
}
