import * as React from 'react';

import * as Props from 'component/props';
import * as Selector from 'component/selectorBase';

/** CheckboxProps are passed to a Checkbox and mostly indicate whether it's pressed. */
export type CheckboxProps = React.PropsWithChildren<{
    /** HTML id of the inner input element. */
    id: string,
    /** Whether the radio button is checked. */
    checked: boolean,
    /** onChange is called when the user toggles the checkbox. */
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
} & Props.Disableable>;

/** Checkbox is an input for toggling a boolean value. */
export default function Checkbox(props: CheckboxProps) {
    return (
        <Selector.Label htmlFor={props.id} disabled={props.disabled}>
            <Selector.HiddenInput {...props} children={undefined} />
            <Selector.Brackets disabled={props.disabled}>
                [
                    <Selector.Indicator>
                        {props.checked ? 'X' : ' '}
                    </Selector.Indicator>
                ]
            </Selector.Brackets>
            {props.children}
        </Selector.Label>
    );
}
