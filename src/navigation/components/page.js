// @flow

import './Page.css';

import * as React from 'react';
import { connect } from 'react-redux';

import SkillsTabs from '../../character/skills/containers/skills-tabs';
import { EditPage } from '../../edit/containers';

import type { NavigationState } from '../state';
import type { AppState, DispatchFn } from '../../state';

type Props = {
    dispatch: DispatchFn,
    state: NavigationState
}

class Page extends React.Component<Props> {
    render() {
        switch (this.props.state.page) {
            case "combat":
                return (
                    <span>Combat</span>
                );
            case "skills":
                return (
                    <SkillsTabs />
                );
            case "attributes":
                return (
                    <span>Attributes</span>
                );
            case "gear":
                return (
                    <span>Gear</span>
                );
            case "edit":
                return (
                    <EditPage />
                );
            case "import":
                return (
                    <span>Import</span>
                )
            case "export":
                return (
                    <span>Export</span>
                );
            default: // Should not happen.
                return (
                    <span>{this.props.state.page.toString()}</span>
                );
        }
    }
}

function mapStateToProps(state: AppState) {
    return {
        state: state.nav
    };
}

export default connect(mapStateToProps)(Page);
