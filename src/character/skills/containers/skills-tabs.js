// @flow

import './skills-tabs.css';

import * as React from 'react';
import { Tabs, Tab } from 'react-bootstrap';

import SkillsListing from './skills-listing';

import * as Skills from '../../../data/skills';

type Props = { };


export default function SkillTabs(props: Props) {
    return (
        <Tabs justified defaultActiveKey="combat"
                        className="panel-text-left"
                        animation={false}>
            <Tab eventKey="combat" title="Combat">
                <h4 className="skill-tab-header">
                    Skills for using weapons and fighting.
                </h4>
                <SkillsListing skills={Skills.ALL_COMBAT_SKILLS} />
            </Tab>
            <Tab eventKey="active" title="Active">
                <h4 className="skill-tab-header">
                    Active skills for infiltrataion and survival.
                </h4>
                <SkillsListing skills={Skills.ALL_ACTIVE_SKILLS} />
            </Tab>
            <Tab eventKey="technical" title="Technical">
                <h4 className="skill-tab-header">
                    Technical skills for hacking, repairing, and piloting.
                </h4>
                <SkillsListing skills={Skills.ALL_TECHNICAL_SKILLS} />
            </Tab>
            <Tab eventKey="vehicular" title="Vehicular">
                <h4 className="skill-tab-header">
                    Skills for piloting and repairing vehicles.
                </h4>
                <SkillsListing skills={Skills.ALL_VEHICULAR_SKILLS} />
            </Tab>
            <Tab eventKey="social" title="Social">
                <h4 className="skill-tab-header">
                    For all your facing needs.
                </h4>
                <SkillsListing skills={Skills.ALL_SOCIAL_SKILLS} />
            </Tab>
            <Tab eventKey="magic" title="Magic">
                <h4 className="skill-tab-header">
                    Magic-related skills.
                </h4>
                <SkillsListing skills={Skills.ALL_MAGIC_SKILLS} />
            </Tab>
            <Tab eventKey="techno" title="Technomancy">
                <h4 className="skill-tab-header">
                    For all your meddling with the Matrix.
                </h4>
                <SkillsListing skills={Skills.ALL_TECHNO_SKILLS} />
            </Tab>
            <Tab eventKey="knowledge" title="Knowledge" disabled>

            </Tab>
        </Tabs>
    );
}
