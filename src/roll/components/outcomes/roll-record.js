// @flow

import './roll-record.css';

import * as React from 'react';
import {
    Alert,
    Label,
    Button,
    ButtonGroup,
    Popover,
    OverlayTrigger,
    Glyphicon,
} from 'react-bootstrap';

type RollRecordProps = {
    recordKey: number;
    mode: string;
    label: string;
    onClose: (number) => void;
    message: React.Node;
    tooltip: React.Node;
}

function mutedOnClick(event: SyntheticInputEvent<HTMLButtonElement>) {
    event.preventDefault();
}

export default class RollRecord extends React.Component<RollRecordProps> {
    handleCloseButton = () => {
        this.props.onClose(this.props.recordKey);
    }

    render() {
        const infoOverlay = (
            <Popover title="Rolls (sorted)">
                {this.props.tooltip}
            </Popover>
        );
        return (
            <Alert className="roll-record-panel"
                   bsStyle={this.props.mode}>
                <div class="roll-record-info">
                    <Label className="roll-record-label"
                           bsStyle="info">
                        {this.props.label}
                    </Label>
                    {this.props.message}
                </div>
                <ButtonGroup className='roll-record-buttons'>
                    <OverlayTrigger trigger={['hover', 'focus']}
                                    placement='left'
                                    overlay={infoOverlay}>
                        <Button className='roll-record-info'
                                onClick={mutedOnClick}
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
            </Alert>
        );
    }
}