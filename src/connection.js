// @flow

import * as React from 'react';
import * as UI from 'style';
import type { Setter } from 'srutil';

export type Connection = "offline" | "connecting" | "connected" | "errored" | "disconnected";
export type RetryConnection = Connection | "retrying";
export type SetConnection = Setter<Connection>;
export type SetRetryConnection = Setter<RetryConnection>;

export const ConnectionCtx = React.createContext<RetryConnection>("connected");
export const SetConnectionCtx = React.createContext<SetRetryConnection>(() => {});

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

export function StatusText({ connection }: { connection: RetryConnection }) {
    let text = null;
    switch (connection) {
        case "connecting":
        case "disconnected":
        case "errored":
            text = connection;
        case "retrying":
            text = "Reconnecting";
    }
    if (text) {
        return (
            <i>
                <UI.DiceSpinner />
                {text}...
            </i>
        );
    }
    return null;
}
