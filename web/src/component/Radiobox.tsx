import * as React from 'react';

import * as Props from 'component/props';
import * as Selector from 'component/selectorBase';

export type RadioProps = React.PropsWithChildren<{
    /** id is the HTML id of the inner input element. */
    id: string,
    /** name is the group of radioboxes this component is part of. */
    name: string,
    /** selected indicates whether this radiobox is currently selected. */
    selected: boolean,
    /** onChange is called when the user selects a given radiobox. */
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
} & Props.Disableable>;

/** Radiobox is an input for selecting an item from a fixed [small] set of options. */
export default function Radiobox(props: RadioProps) {
    return (
        <Selector.Label htmlFor={props.id} disabled={props.disabled}>
            <Selector.HiddenInput {...props} type="radio" children={undefined} />
            <Selector.Brackets disabled={props.disabled}>
                (
                    <Selector.Indicator>
                        {props.selected ? 'X' : ' '}
                    </Selector.Indicator>
                )
            </Selector.Brackets>
            {props.children}
        </Selector.Label>
    );
}
