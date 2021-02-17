import * as React from "react";
import { RetryConnection } from "connection";
import * as UI from "style";

export default function StatusText({ connection }: { connection: RetryConnection }) {
    let text = null;
    switch (connection) {
        case "connecting":
        case "disconnected":
        case "errored":
            text = connection;
            break;
        case "retrying":
            text = "Reconnecting";
            break;
        default:
            break;
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
