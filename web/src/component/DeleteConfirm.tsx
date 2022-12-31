import * as React from "react";

import * as UI from "style";
import * as Button from "component/Button";

type Props = {
    id: string,
    ready: boolean,
    setReady: React.Dispatch<React.SetStateAction<boolean>>,
    onDelete: () => void,
};
export default function DeleteConfirm({ id, ready, setReady, onDelete }: Props) {
    return (
        <UI.FlexRow formRow spaced>
            <Button.Main id={`${id}-delete-toggle-prompt`} onClick={() => setReady(r => !r)}>
                delete
            </Button.Main>
            {ready && (
                <UI.FlexRow spaced>
                    <i>You sure?</i>
                    <Button.Main id={`${id}-delete-confirm-delete`} onClick={onDelete}>
                        yes
                    </Button.Main>
                    <b>|</b>
                    <Button.Main id={`${id}-delete-cancel`} onClick={() => setReady(false)}>
                        no
                    </Button.Main>
                </UI.FlexRow>
            )}
        </UI.FlexRow>
    );
}
