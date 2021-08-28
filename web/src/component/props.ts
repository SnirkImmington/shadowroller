import * as srutil from 'srutil';

/** DisableableProps adds an optional `disabled` flag to a component. */
export type Disableable = {
    /** disabled indicates if this component should be in a disabled state,
        where it is unable to be interacted with by users, usually implemented
        with HTML `:disabled`. */
    disabled?: boolean
}

export type Colorable = {
    color: string
}

export type Toggle = Colorable & {
    checked: boolean,
    setChecked: srutil.Setter<boolean>
}

export type Styleable = {
    style?: React.StyleHTMLAttributes<HTMLOrSVGElement>
}
