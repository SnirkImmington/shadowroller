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
            "btn btn-light rounded-0 active" : "btn rounded-0 btn-light";
        return (
            <label className={labelClass} key={rollMode}>
                <input type="radio"
                       name="roll-mode"
                       autocomplete="off"
                       id={"roll-mode" + rollMode}
                       checked={rollMode === props.selected}
                       onChange={() => props.onSelect(rollMode)}
                       key={rollMode} />
                {RollModes[rollMode].title}
            </label>
        );
    });

    return (
        <div className="btn-group btn-group-toggle flex-button-group rounded-0"
             data-toggle="buttons">
            {labels}
        </div>
    );
}
