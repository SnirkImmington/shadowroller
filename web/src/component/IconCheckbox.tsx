import * as React from 'react';

import * as UI from 'style';
import * as icons from 'style/icon';

import type { IconProp } from '@fortawesome/fontawesome-svg-core';
import type { Setter } from 'srutil';
import type { Colorable, HasID, Disableable } from 'component/props';

type Props = HasID & Colorable & Disableable & {
    icon: IconProp,
    transform?: string,
    checked: boolean,
    setChecked: Setter<boolean>,
}

export default function IconCheckbox(props: React.PropsWithChildren<Props>) {
    const { id, color, disabled, icon, transform, checked, setChecked } = props;
    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setChecked(e.target.checked);
        },
        [setChecked]
    );

    return (
        <UI.RadioLink id={id} type="checkbox" light
                      checked={checked} onChange={onChange} disabled={disabled}>
            <UI.TextWithIcon color={color}>
                <UI.FAIcon transform={transform || ""}
                           className="icon-inline" icon={icon} />
                {props.children}
            </UI.TextWithIcon>
        </UI.RadioLink>
    );
}
