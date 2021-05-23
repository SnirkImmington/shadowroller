import * as icons from 'style/icon';
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/** Mode is the visibility of some events in a game. */
export enum Mode {
    /** All players may see the event */
    InGame = 0,
    /** Only the originator of the event may see it */
    Private = 1,
    /** The game masters and originator of the event may see it */
    GMs = 2,
}

export function parseMode(share: number): Mode {
    switch (share) {
        case 0: return Mode.InGame;
        case 1: return Mode.Private;
        case 2: return Mode.GMs;
        default:
            if (process.env.NODE_ENV === "development") {
                console.error("Asked to parse invalid mode", share);
            }
            return Mode.InGame;
    }
}

/** icon produces an icon for the given share mode */
export function icon(share: Mode): IconDefinition {
    switch (share) {
        case Mode.InGame: return icons.faUsers;
        case Mode.Private: return icons.faUserSecret;
        case Mode.GMs: return icons.faUserFriends;
        default:
            if (process.env.NODE_ENV !== "production") {
                const share_: never = share;
                console.log("icon: got unknown share", share_);
            }
            throw new Error(`Invalid share ${share}`);
    }
}
