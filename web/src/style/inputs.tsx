import * as React from 'react';

import Radiobox from 'component/Radiobox';
import Checkbox from 'component/Checkbox';

export { default as Input } from 'component/Input';

type RadioLinkProps = React.PropsWithChildren<{
    id: string,
    name?: string,
    light?: boolean,
    type: "checkbox" | "radio",
    checked: boolean,
    value?: string,
    disabled?: boolean,
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
}>;

export const RadioLink = React.memo<RadioLinkProps>(function RadioLink(props) {
    if (props.type === "checkbox") {
        return <Checkbox {...props} />;
    } else {
        return <Radiobox {...props} name={props.name!} selected={props.checked} />;
    }
});
