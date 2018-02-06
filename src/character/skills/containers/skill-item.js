// @flow

import './skill-item.css';

import * as React from 'react';
import {
    Button,
    Glyphicon,
    ListGroupItem
} from 'react-bootstrap';

import RollInputPanel from '../../../roll/containers/roll-input-panel';

import type { Skill, SkillInfo } from '../../../data/skills';

import format from '../../../util/format';

type Props = {
    skill: Skill,
    info: SkillInfo
};

type State = {
    active: boolean
};

export default class SkillItem extends React.Component<Props, State> {
    constructor() {
        super();
        this.state = {
            active: false
        };
    }

    handleClick = () => {
        this.setState(prevState => ({
            active: !prevState.active
        }));
    }

    render() {
        const skillInfo = this.props.info;
        const skillName = skillInfo.name !== undefined ?
            format(skillInfo.name, 'title') : format(this.props.skill, 'title');
        const attrName = format(skillInfo.attr, 'title');
        const canUse = skillInfo.default;
        const headerStyle = canUse ?
                        "skill-item-name" : "skill-item-name-invalid";
        const buttonStyle = canUse ?
                            this.state.active ? "chevron-up" : "chevron-down"
                            : "minus";
        const header = (
            <div className="skill-item-header"
                 onClick={canUse ? this.handleClick : null}>
                <span className={headerStyle}>{skillName}</span>
                <span className="skill-item-description">
                    {`Skill 0 + ${attrName} 0`}
                </span>
                <span className="skill-item-indicator">
                    <Glyphicon glyph={buttonStyle} />
                </span>
            </div>
        );

        let body = "";
        if (this.state.active) {
            body = (
                <RollInputPanel title={`Skill ${skillName}`} />
            );
        }

        return (
            <ListGroupItem eventKey={this.props.skill}
                           disabled={!canUse}>
                {header}
                {body}
            </ListGroupItem>
        );
    }
}
