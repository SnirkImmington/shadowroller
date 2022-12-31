import type { MouseEvent } from "react";

import * as Button from 'component/Button';
import { faUsers } from 'style/icon';

type Props = {
    onClick: (e: MouseEvent<HTMLButtonElement>) => void,
    disabled?: boolean,
};

/** An action button with a "users" icon for revealing an event */
export default function RevealButton({ onClick, disabled }: Props) {
    return (
        <Button.Minor disabled={disabled} onClick={onClick}>
            <Button.Icon className="icon-inline" icon={faUsers} transform="grow-6" />
            reveal
        </Button.Minor>
    );
}
