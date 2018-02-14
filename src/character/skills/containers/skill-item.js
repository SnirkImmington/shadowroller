// @flow

import './skill-item.css';

import * as React from 'react';
import {
    Glyphicon,
    ListGroupItem
} from 'react-bootstrap';

import RollInputPanel from '../../../roll/containers/roll-input-panel';

import type { Skill, SkillInfo } from '../../../data/skills';

import format from '../../../util/format';

type Props = {
    skill: Skill,
    info: SkillInfo,
    skillPool: number,
    attrVal: number
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
        const canUse = this.props.skillPool > 0 ? true : skillInfo.default;
        const buttonStyle = canUse ?
                            this.state.active ? "chevron-up" : "chevron-down"
                            : "minus";
        const indicator = (
            <span className="skill-item-indicator">
                <Glyphicon glyph={buttonStyle} />
            </span>
        );
        let header: React.Node;
        // Skill has rating.
        if (this.props.skillPool > 0) {
            const totalPool = this.props.skillPool + this.props.attrVal;
            header = (
                <div className="skill-item-header" onClick={this.handleClick}>
                    <span className="skill-item-name">
                        {`${skillName} ${totalPool}`}
                    </span>
                    <span className="skill-item-description">
                        {`Skill ${this.props.skillPool} + ${attrName} ${this.props.attrVal}`}
                    </span>
                    {indicator}
                </div>
            );
        }
        else if (skillInfo.default) {
            const totalPool = this.props.attrVal - 1;
            header = (
                <div className="skill-item-header" onClick={this.handleClick}>
                    <span className="skill-item-name">
                        {`${skillName} ${totalPool}`}
                    </span>
                    <span className="skill-item-description">
                        {`Default on ${attrName} ${this.props.attrVal}`}
                    </span>
                    {indicator}
                </div>
            );
        }
        else {
            header = (
                <div className="skill-item-header skill-item-header-disabled" onClick={null}>
                    <span className="skill-item-name">
                        {`${skillName}`}
                    </span>
                    <span className="skill-item-description">
                        {`Cannot default on ${skillName} + ${attrName}`}
                    </span>
                    {indicator}
                </div>
            );
        }

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
