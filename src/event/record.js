// @flow

import * as React from 'react';
import styled from 'styled-components/macro';

import type { GameEvent, LocalRollEvent } from 'event/state';

type BaseProps = { +title: React.Node, +body: React.Node };
function RecordBase({ title, body }: BaseProps) {
    return (
        <div>
            <div>[ {title} </div>
            <div>{body}</div>
        </div>
    );
}

export function LocalRollRecord({ event }: { event: LocalRollEvent }) {
    const title = (
        `Rolled ${event.dice.length} dice`
    );
    const body = (
        <DiceList dice={event.dice} />
    );

    return <RecordBase title={title} body={body} />;
}
