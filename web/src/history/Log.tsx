import * as React from "react";
import styled from 'styled-components/macro';
import * as Text from 'component/Text';

import * as Event from 'event';
import * as Game from 'game';
import * as Player from 'player';
import { ConnectionCtx } from 'connection';
import * as server from 'server';
import * as routes from 'routes';
import { EditEventCtx } from './EditingState';
import * as srutil from 'srutil';

import { LoadingAutosizeList } from "list/LoadingAutosizeList";
import * as Record from 'record';

/** Key of an event in the event list - the event ID */
function itemKey(index: number, data: Event.Event[]) {
    if (!data || !data[index]) {
        return index;
    }
    return data[index].id;
}

function Item({ index, data }: { index: number, data: Event.Event[], }) {
    const game = React.useContext(Game.Ctx);
    const player = React.useContext(Player.Ctx);
    const editing = React.useContext(EditEventCtx);
    const gamePlayers = game?.players;

    if (!data[index]) {
        console.log(`record render(ix=${index}, id=${data[index]?.id}): loading`);
        return <Record.Loading />;
    }
    const event = data[index];
    let hue = null;
    if (gamePlayers && event.source !== "local") {
        const player = gamePlayers.get(event.source.id);
        if (player) {
            hue = player.hue;
        } else {
            console.log("Unable to find player for event", event.id);
        }
    }
    if (editing === event.id) {
        return <Record.Edit event={event} hue={hue} playerID={null} />;
    }
    return <Record.Record event={event} hue={hue} playerID={player?.id ?? null} />;
};

export default function Log() {
    const event = React.useContext(Event.Ctx);

    const eventDispatch = React.useContext(Event.DispatchCtx);
    const connection = React.useContext(ConnectionCtx);

    const loading = event.historyFetch === "fetching";

    // This callback could be memoized or moved out of the component with state redesign
    const handleLoad = React.useCallback(function handleLoad(oldestIx: number) {
        if (event.historyFetch === "fetching" || event.historyFetch === "finished" || connection === "offline") {
            console.log(`log.load(ix=${oldestIx}): not online or already loading`);
            return;
        }
        const oldest = event.events[oldestIx - 1];
        if (!oldest) {
            console.log(`log.load(ix=${oldestIx}): oldest not found`);
            return;
        }
        console.log(`log.load(ix=${oldestIx}): load began`);
        eventDispatch({ ty: "setHistoryFetch", state: "fetching" });
        const oldestID = oldest.id || Date.now().valueOf();
        return routes.game.getEvents({ newest: oldestID })
            .onResponse(resp => {
                console.log(`log.load(ix=${oldestIx}): fetch complete`);
                eventDispatch({ ty: "setHistoryFetch", state: resp.more ? "ready" : "finished" });
                resp.events.forEach(server.normalizeEvent);
                console.log(`log.load(ix=${oldestIx}): merge ${resp.events.length} events`);
                eventDispatch({ ty: "mergeEvents", events: resp.events });
            })
            .onAnyError(err => {
                if (process.env.NODE_ENV !== "production") {
                    console.error("Error fetching events:", err);
                }
                // TODO no error handling here.
                eventDispatch({ ty: "setHistoryFetch", state: "finished" });
            });
    }, [event.historyFetch, event.events, eventDispatch, connection,]);

    if (event.events.length === 0) {
        return <>No events here!</>;
    }

    return (
        <LoadingAutosizeList loadedItems={event.events}
            loading={loading} load={handleLoad}
            itemKey={itemKey} loadElem={Record.Loading}>
            {Item}
        </LoadingAutosizeList>
    );
}
