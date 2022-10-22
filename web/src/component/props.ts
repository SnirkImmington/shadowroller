
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

/** HasID adds an `id` prop, which is used to generate form IDs. */
export type HasID = {
    id: string
}

export type Toggle = Colorable & {
    checked: boolean,
    setChecked: (value: boolean) => void,
}

export type Styleable = {
    style?: React.StyleHTMLAttributes<HTMLOrSVGElement>
}
