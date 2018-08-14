// @flow

import * as React from 'react';
import { ListGroup } from 'react-bootstrap';
import SkillItem from './skill-item';
import { connect } from 'react-redux';

import type { Skill, SkillInfo } from '../../../data/skills';
import type { AppState } from '../../../state';
import type { CharacterState } from '../../../character/state';

type Props = {
    skills: { [Skill]: SkillInfo },
    state: CharacterState
};

class SkillList extends React.Component<Props> {
    render() {
        const items = Object.keys(this.props.skills).map(skill => {
            const skillInfo = this.props.skills[skill];
            return (
                <SkillItem skill={skill}
                       info={skillInfo}
                       skillPool={this.props.state.skills[skill]}
                       attrVal={this.props.state.attributes[skillInfo.attr]}
                       key={skill} />
            );
        });

        return (
            <ListGroup collapsible className="scroll-list skills-listing">
                {items}
            </ListGroup>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        state: state.character
    };
}

export default connect(mapStateToProps)(SkillList);
