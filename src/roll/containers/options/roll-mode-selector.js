// @flow

import './roll-mode-selector.css';

import * as React from 'react';

import type { RollMode } from '../../index';
import { RollModes } from '../../index';

type Props = {
    selected: RollMode;
    onSelect: (RollMode) => void;
};

export default function RollModeSelector(props: Props) {
    const labels: React.Node[] = Object.keys(RollModes).map(rollMode => {
        const labelClass = rollMode === props.selected ?
            "btn btn-light active" : "btn btn-light";
        return (
            <label class={labelClass}>
                <input type="radio"
                       name="roll-mode"
                       autocomplete="off"
                       id={"roll-mode" + rollMode}
                       checked={rollMode === props.selected}
                       onChange={() => props.onSelect(rollMode)} />
                {RollModes[rollMode].title}
            </label>
        );
    });

    return (
        <div class="btn-group btn-group-toggle mx-4"
             data-toggle="buttons">
            {labels}
        </div>
    );
}
