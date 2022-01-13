import * as Event from 'event';
import * as Game from 'game';
import * as Player from 'player';
import * as Share from 'share';
import * as server from 'server';

export function handleMessage(e: MessageEvent, playerID: string, eventDispatch: Event.Dispatch, gameDispatch: Game.Dispatch, playerDispatch: Player.Dispatch) {
    let updateData: any[];
    try {
        // flow-ignore-all-next-line it's json parse
        updateData = JSON.parse(e.data);
    }
    catch (err) {
        console.error("Unparseable Update received from server:", err, e);
        return;
    }

    if (typeof updateData !== "object" || updateData.length < 2) {
        console.error("Invalid update type from server:", updateData);
        return;
    }

    const ty = updateData[0];
    updateData = updateData.slice(1);

    if (process.env.NODE_ENV === "development") {
        console.log("SSE: update", ty, ...updateData);
    }

    switch (ty) {
        case "+evt":
            const [newEvent] = updateData as [Event.Event];
            const parsedNewEvent = server.parseEvent(newEvent);
            if (!parsedNewEvent) {
                if (process.env.NODE_ENV === "development") {
                    console.error("Unable to parse new event", updateData);
                }
                return;
            }
            eventDispatch({ ty: "newEvent", event: parsedNewEvent });
            return;
        case "-evt":
            const [delEventID] = updateData as [number];
            eventDispatch({ ty: "deleteEvent", id: delEventID });
            return;
        case "~evt":
            const [modEventID, eventDiff, eventEdit] = updateData as [number, Partial<Event.Event & { "share": number}>, number];
            if (eventDiff.share != null) {
                const eventShare = Share.parseMode(eventDiff.share);
                eventDispatch({
                    ty: "modifyShare", id: modEventID, edit: eventEdit, share: eventShare,
                });
                delete eventDiff.share;
            }
            if (Object.keys(eventDiff).length > 0) {
                eventDispatch({ ty: "modifyEvent", id: modEventID, edit: eventEdit, diff: eventDiff });
            }
            return;
        case "^roll":
            const [rerollEventID, { reroll }, rerollEdit] = updateData as [number, {reroll: number[]}, number];
            eventDispatch({ ty: "reroll", id: rerollEventID, edit: rerollEdit, reroll });
            return;

        case "+plr":
            const [newPlayer] = updateData as [Player.Info];
            gameDispatch({ ty: "newPlayer", player: newPlayer });
            return;
        case "-plr":
            const [delPlayerID] = updateData as [string];
            gameDispatch({ ty: "deletePlayer", id: delPlayerID });
            return;
        case "~plr":
            const [modPlayerID, playerDiff] = updateData as [string, Partial<Player.Info>];
            if (modPlayerID === playerID) {
                playerDispatch({ ty: "update", diff: playerDiff });
            }
            gameDispatch({ ty: "updatePlayer", id: modPlayerID, diff: playerDiff });
            return;
    }
}
