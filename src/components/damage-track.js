// @flow

import './damage-track.css';

import * as React from 'react';
import { Glyphicon } from 'react-bootstrap';

type Props = {
    damage: number,
    max: number,
};

// Max = 8
// damage = 5
// > columns = 3
// > penalty = 1
// [DDD][DDY][YY]

export default function DamageTrack(props: Props) {
    const numColumns = Math.ceil(props.max / 3);
    const columns: React.Node[] = [];

    // Holy crap, a counted for loop!
    for (let column = 0; column < numColumns; column++) {
        let boxNodes: React.Node[] = [];
        let boxesInColumn = Math.min(props.max - (column * 3), 3);

        const columnIsFilled = ((column * 3) + boxesInColumn) <= props.damage;

        for (let box = 0; box < boxesInColumn; box++) {
            let hit = (column * 3) + box;
            if (columnIsFilled) {
                boxNodes.push(
                    <Glyphicon glyph="stop"
                               className="damage-track-box-filled" />
                );
            }
            else if (hit < props.damage) {
                boxNodes.push(
                    <Glyphicon glyph="stop"
                               className="damage-track-box-damaged" />
                );
            }
            else {
                boxNodes.push(
                    <Glyphicon glyph="stop"
                               className="damage-track-box-undamaged" />
                );
            }
        }

        columns.push(
            <span className='damage-track-column-good'>
                {boxNodes}{" "}
            </span>
        );
    }
    return (
        <span className='damage-track'>
            {columns}
        </span>
    );
}
