// @flow

import * as React from 'react';
import { Tabs, Tab, ListGroup } from 'react-bootstrap';
import { connect } from 'react-redux';

import EditSkillItem from './edit-skill-item';

import type { DispatchFn, AppState } from '../../state';
import type { Skill, SkillInfo } from '../../data/skills';
import type { CharacterState } from '../../character/state';
import * as skillActions from '../../character/skills/actions';

import * as skills from '../../data/skills';

type Props = {
    dispatch: DispatchFn,
    state: AppState,
};

function skillListing(skills: { [Skill]: SkillInfo },
                      state: CharacterState,
                      dispatch: DispatchFn): React.Node {
    const items = Object.keys(skills).map(skill => {
        const skillInfo = skills[skill];
        return (
            <EditSkillItem skill={skill} key={skill}
                           info={skillInfo}
                           current={state.skills[skill]}
                           onChange={(skill: Skill, value: number) => {
                               dispatch(skillActions.skillChanged(skill, value));
                           }} />
        );
    });
    return (
        <ListGroup className="edit-skill-listing">
            {items}
        </ListGroup>
    )
}

class EditSkills extends React.Component<Props> {
    render() {
        const dispatch = this.props.dispatch;
        const state = this.props.state.character;
        return (
            <Tabs defaultActiveKey="combat"
                  className="edit-skills-panel">
                <Tab eventKey="combat" title="Combat">
                    {skillListing(skills.ALL_COMBAT_SKILLS, state, dispatch)}
                </Tab>
                <Tab eventKey="active" title="Active">
                    {skillListing(skills.ALL_ACTIVE_SKILLS, state, dispatch)}
                </Tab>
                <Tab eventKey="technical" title="Technical">
                    {skillListing(skills.ALL_TECHNICAL_SKILLS, state, dispatch)}
                </Tab>
                <Tab eventKey="vehicular" title="Vehicular">
                    {skillListing(skills.ALL_VEHICULAR_SKILLS, state, dispatch)}
                </Tab>
                <Tab eventKey="social" title="Social">
                    {skillListing(skills.ALL_SOCIAL_SKILLS, state, dispatch)}
                </Tab>
                <Tab eventKey="magic" title="Magic">
                    {skillListing(skills.ALL_MAGIC_SKILLS, state, dispatch)}
                </Tab>
                <Tab eventKey="techno" title="Technomancy">
                    {skillListing(skills.ALL_TECHNO_SKILLS, state, dispatch)}
                </Tab>
                <Tab eventKey="knowledge" title="Knowledge" disabled>

                </Tab>
            </Tabs>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        state
    };
}

export default connect(mapStateToProps)(EditSkills);
