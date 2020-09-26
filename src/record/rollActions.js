// @flow

import * as React from 'react';

import * as UI from 'style';

import * as Event from 'event';
import * as Game from 'game';
import { ROLL_TITLE_FLAVOR } from 'roll-dice';
import * as srutil from 'srutil';

export type RollActions = {|
    +edge?: {|
        //onPush: (Event.Roll) => void,
        +onSecondChance: (Event.Roll) => void,
    |},
    +onRename: (Event.DiceEvent) => void,
    +onRemove: (Event.DiceEvent) => void,
|};

function localRollActions(dispatch: Event.Dispatch): RollActions {
    function onRename(event: Event.DiceEvent, newName: string) {
        dispatch({
            ty: "modifyEvent",
            id: event.id,
            diff: {
                title: newName,
                oldTitle: event.title,
            }
        })
    }
}

type RenameRollActionProps = {
    event: Event.DiceEvent;
    onRename: (string) => void;
}
export function RenameRollAction({ event, onRename }: RenameRollActionProps) {
    return (
        <UI.FlexRow>
            New title
            <UI.Input expand placeholder={event.title} />
            <UI.LinkButton>
                Y
            </UI.LinkButton>
            <UI.LinkButton>
                n
            </UI.LinkButton>
        </UI.FlexRow>
    );
}

export function RollActionsRow({edgeActions, onPush, onSecondChance, onRemove}: RollActionsProps) {
    const titleFlavor = srutil.useFlavor(ROLL_TITLE_FLAVOR);
    return (
        <UI.LinkList>
            <UI.LinkButton onClick={onSecondChance}>
                second chance
            </UI.LinkButton>
            {/*<UI.LinkButton disabled={!edgeActions} onClick={onPush}>
                push the limit
            </UI.LinkButton>*/}
            <span style={{flexGrow: '1'}} />
            <UI.LinkButton onClick={null}>
                rename
            </UI.LinkButton>
            <UI.LinkButton onClick={onRemove}>
                remove
            </UI.LinkButton>
        </UI.LinkList>
    );
}
