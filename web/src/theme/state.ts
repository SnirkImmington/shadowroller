import * as React from 'react';

export type Mode = "light"|"dark";
export const defaultMode = "dark"

export type Dispatch = (mode: Mode) => void;
export const Ctx = React.createContext<Mode>(defaultMode);
export const DispatchCtx = React.createContext<Dispatch>(() => {});
