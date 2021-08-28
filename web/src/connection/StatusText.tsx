import { RetryConnection } from "connection";
import * as Dice from 'component/Dice';

export default function StatusText({ connection }: { connection: RetryConnection }) {
    let text = "";
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
    if (text !== "") {
        return (
            <i>
                <Dice.Spinner />
                {text}...
            </i>
        );
    }
    return null;
}
