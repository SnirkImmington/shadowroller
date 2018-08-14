// @flow

import * as React from 'react';
import { Panel, PanelGroup } from 'react-bootstrap/lib';
import { connect } from 'react-redux';

import SkillItem from './skill-item';
import SkillsListing from './skills-listing';
import * as Skills from '../../../data/skills';

import type { Skill, SkillInfo } from '../../../data/skills';
import type { AppState } from '../../../state';
import type { CharacterState } from '../../../character/state';

type Props = {
    skills: { [Skill]: SkillInfo },
    state: CharacterState
};

export default function SkillSelector(props: Props) {
    return (
        <PanelGroup accordian collapsible activeKey="combat" defaultActiveKey="combat">
            <Panel eventKey="combat" header="Combat">
                <SkillsListing skills={Skills.ALL_COMBAT_SKILLS} />
            </Panel>
            <Panel eventKey="active" header="Active">
                <SkillsListing skills={Skills.ALL_ACTIVE_SKILLS} />
            </Panel>
            <Panel header="Technical" eventKey="technical">
                <SkillsListing skills={Skills.ALL_TECHNICAL_SKILLS} />
            </Panel>
            <Panel header="Vehicular" eventKey="vehicular">
                <SkillsListing skills={Skills.ALL_VEHICULAR_SKILLS} />
            </Panel>
            <Panel header="Social" eventKey="social">

            </Panel>
            <Panel header="Magic" eventKey="magic">

            </Panel>
            <Panel header="Technomancy" eventKey="technomancy">
                
            </Panel>
        </PanelGroup>
    );
}
