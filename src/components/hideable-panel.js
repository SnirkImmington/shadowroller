// @flow

import '../App.css';

import * as React from 'react';
import { Panel } from 'react-bootstrap';

type Props = {
    bsStyle?: "success" | "info" | "warning" | "danger" | "default" | "primary",
    header?: React.Node,
    hidden?: boolean,
    children?: React.Node,
}
