// @flow

import React, { Component } from 'react';
import {
    Alert,
    Label,
    Button,
    ButtonGroup,
    Popover,
    OverlayTrigger,
    Glyphicon,
    Panel,
} from 'react-bootstrap';

import '../roll-menu.css';

import typeof RollOutcome from '../result/roll-outcome';

type RollRecordProps = {
    recordKey: number;
    mode: string;
    label: string;
    onClose: (number) => void;
    message: any;
    tooltip: any;
}

export default class RollRecord extends Component<RollRecordProps> {
    handleCloseButton: Function;

    constructor(props: RollRecordProps) {
        super(props);
        this.handleCloseButton = this.handleCloseButton.bind(this);
    }

    handleCloseButton() {
        this.props.onClose(this.props.recordKey);
    }

    render() {
        const infoOverlay = (
            <Popover title="Info">
                {this.props.tooltip}
            </Popover>
        );
        return (
            <Alert className="roll-record-panel"
                   bsStyle={this.props.mode}>
                <div class="roll-record-left">
                    <Label className="roll-record-label"
                           bsStyle="info">
                        {this.props.label}
                    </Label>
                    {this.props.message}
                </div>
                <div class="roll-record-right">
                    <ButtonGroup>
                    <OverlayTrigger trigger={['hover', 'focus']}
                                    placement='left'
                                    overlay={infoOverlay}>
                        <Button className='roll-record-info'
                                bsStyle='info'>
                            <Glyphicon glyph='info-sign' />
                        </Button>
                    </OverlayTrigger>
                    <Button className="roll-record-close"
                            bsStyle="warning"
                            onClick={this.handleCloseButton}>
                        <Glyphicon glyph='remove' />
                    </Button>
                    </ButtonGroup>
                </div>
            </Alert>
        );
    }
}
