// @flow

import * as React from 'react';
import { Tabs, Tab, Panel } from 'react-bootstrap';
import { connect } from 'react-redux';

import type { CharacterState } from '../../state';

type Props = {
    dispatch: DispatchFn,
    character: CharacterState,
};

class ActiveSkillTabs extends React.Component<Props> {

}
