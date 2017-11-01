// @flow

import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

type RollButtonProps = {
    isLoading: boolean,
    onClick: (SyntheticInputEvent<Button>) => void,
}

/** Renders the "Roll dice" button */
function RollButton(props: RollButtonProps) {
    return (
        <Button bsStyle="primary"
                bsSize='large'
                disabled={props.isLoading}
                onClick={!props.isLoading ? props.onClick : null}>
            Roll dice
        </Button>
    );
}

export default RollButton;
