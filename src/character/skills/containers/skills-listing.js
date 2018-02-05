// @flow

import * as React from 'react';
import { ListGroup } from 'react-bootstrap';
import SkillItem from './skill-item';

import type { Skill, SkillInfo } from '../../../data/skills';

import format from '../../../util/format';

type Props = {
    skills: { [Skill]: SkillInfo }
};

export default function SkillList(props: Props) {
    let items = Object.keys(props.skills).map(skill => (
        <SkillItem skill={skill}
                   info={props.skills[skill]}
                   key={skill} />
    ));

    return (
        <ListGroup className="scroll-list skills-listing">
            {items}
        </ListGroup>
    );
}
