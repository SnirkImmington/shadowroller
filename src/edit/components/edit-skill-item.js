// @flow

import './edit-skill-item.css';

import * as React from 'react';
import {
    ListGroupItem,
    ControlLabel, FormControl, FormGroup
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
    return (
        <ListGroupItem eventKey={props.skill}>
            <div className="edit-skill-item-header">
                <b>{skillName}</b>
                <form id={`edit-skill-${props.skill}`}>
                    <FormGroup controlId={`edit-skill-${props.skill}-old`}>
                        <ControlLabel>Old value:</ControlLabel>
                        <FormControl disabled
                                     id={`edit-skill-${props.skill}-old`}
                                     value={props.current} />
                    </FormGroup>
                    <FormGroup controlId={`edit-skill-${props.skill}-set`}>
                        <FormControl id={`edit-skill-${props.skill}-set`}
                                     type="number"
                                     onChange={(event: SyntheticInputEvent<HTMLInputElement>) => {
                                         props.onChange(props.skill,
                                             event.target.valueAsNumber);
                                     }} />
                    </FormGroup>
                </form>
            </div>
        </ListGroupItem>
    )
}
