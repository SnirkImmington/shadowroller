// @flow

import * as React from 'react';

export type Connection = "offline" | "connecting" | "connected" | "errored" | "disconnected";
export type SetConnection = (Connection | (Connection => Connection)) => void;

export const ConnectionCtx = React.createContext<Connection>("connected");
export const SetConnectionCtx = React.createContext<SetConnection>(() => {});

export function connectionFor(response: Response): Connection {
    if (!response.status) {
        return "disconnected";
    }
    else if (response.ok) {
        return "connected";
    }
    return "errored";
}

export type ResponseStatus = | "success" | "badRequest" | "serverError" | "noConnection";
export type SetResponse = (ResponseStatus) => void;

export function statusFor(response: Response): ResponseStatus {
    if (!response.status) {
        return "noConnection";
    }
    else if (response.ok) {
        return "success";
    }
    else if (response.status >= 500) {
        return "serverError";
    }
    else {
        return "badRequest";
    }
}
