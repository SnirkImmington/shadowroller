// @flow

import * as React from 'react';

import {
    Well, Panel,
    Form, FormControl, FormGroup, ControlLabel,
    Button
} from 'react-bootstrap';
import { connect } from 'react-redux';

import NumericInput from '../../components/numeric-input';

type Props = {
    dispatch: DispatchFn,
    state: { [string]: string}
};

type State = {
    selectedPoolName: ?string,
    selectedPoolDescription: ?string,
    selectedPoolValue: ?number,
};

function validState(state: State): bool {
    return state.selectedPoolValue != null &&
        state.selectedPoolName !== "" &&
        state.selectedPoolValue > 0 &&
        state.selectedPoolValue < 100;
}

class CreatePoolForm extends React.Component<Props, State> {
    constructor() {
        super();
        this.state = {
            selectedPoolName: null,
            selectedPoolDescription: null,
            selectedPoolValue: null
        };
    }

    handleDiceSelect = (dice: ?number) => {
        this.setState({
            selectedPoolValue: dice
        });
    }

    handleNameSet = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.setState({
            selectedPoolName: event.target.value
        });
    }

    handleDescriptionSet = (event: SyntheticInputEvent<HTMLInputElement>) => {
        this.setState({
            selectedPoolDescription: event.target.value
        });
    }

    render() {
        console.log("Rendering with state ", this.state);
        const readyToAdd = validState(this.state) && this.state.selectedPoolName &&
            this.props.state[this.state.selectedPoolName] == null;

        return (
            <Panel>
                <Form inline id="create-pool-form">
                    <FormGroup >
                        <ControlLabel>Name</ControlLabel>
                        <FormControl type="text"
                                     onChange={this.handleNameSet}/>
                    </FormGroup>
                    <FormGroup>
                        <ControlLabel>Description</ControlLabel>
                        <FormControl type="text"
                                     onChange={this.handleDescriptionSet}/>
                    </FormGroup>
                    <FormGroup controlId="create-pool-dice">
                        <ControlLabel>Dice</ControlLabel>
                        <NumericInput controlId="create-pool-dice"
                                      min={0} max={99}
                                      onSelect={this.handleDiceSelect} />
                    </FormGroup>
                    <Button bsStyle="primary"
                            id="create-pool-form-submit"
                            disabled={!readyToAdd}>
                        Add
                    </Button>
                </Form>
            </Panel>
        );
    }
}

function mapStateToProps(state: AppState) {
    return {
        state: {}
    };
}

export default connect(mapStateToProps)(CreatePoolForm);
