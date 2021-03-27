import * as icons from 'style/icon';
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/** Share.InGame allows all players to see the event */
export const InGame = 0;
/** Share.Private limits the event to the roller */
export const Private = 1;

export type Mode = typeof InGame | typeof Private;

export function icon(share: Mode): IconDefinition {
    switch (share) {
        case InGame: return icons.faUsers;
        case Private: return icons.faUserSecret;
        default:
            if (process.env.NODE_ENV !== "production") {
                const share_: never = share;
                console.log("icon: got unknown share", share_);
            }
            throw new Error(`Invalid share ${share}`);
    }
}
