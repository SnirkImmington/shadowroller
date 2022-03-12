import * as UI from 'style';
import * as Button from 'component/Button';
import * as icons from 'style/icon';

type ButtonProps = {
    disabled: boolean,
    onClick: () => {}
}

export function RevealButton({ disabled, onClick }: ButtonProps) {
    return (
        <Button.Minor disabled={disabled} onClick={onClick}>
            <Button.Icon className="icon-inline" icon={icons.faUserFriends} transform="grow-6" />
            reveal
        </Button.Minor>
    );
}
