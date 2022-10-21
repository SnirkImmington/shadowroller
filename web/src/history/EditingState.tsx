import * as React from 'react';

import type { Setter } from 'srutil';

/** EditEventCtx provides the ID of the event currently being edited. */
export const EditEventCtx = React.createContext<number | null>(null);
/** SetEditEventCtx provides the setter to set the currently edit event. */
export const SetEditEventCtx = React.createContext<Setter<number | null>>(() => { });

/** EditEventContext exposes the EditEventCtx and SetEditEventCtx providers. */
export function EditEventContext({ children }: React.PropsWithChildren<{}>) {
    const [editing, setEditing] = React.useState<number|null>(null);
    return (
        <EditEventCtx.Provider value={editing}>
            <SetEditEventCtx.Provider value={setEditing}>
                {children}
            </SetEditEventCtx.Provider>
        </EditEventCtx.Provider>
    );
}
