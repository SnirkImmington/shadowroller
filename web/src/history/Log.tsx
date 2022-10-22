import * as React from "react";

import * as UI from 'style';

import * as Event from 'event';
import * as Game from 'game';
import { ConnectionCtx } from 'connection';
import * as server from 'server';
import * as routes from 'routes';
import { EditEventCtx } from './EditingState';
import { LoadingAutosizeList } from "list/LoadingAutosizeList";

function LoadingItem() {
    console.log("loadingItem render");
    return <>Loading...</>;
}

function itemKey(index: number, data: Event.Event[]) {
    if (!data || !data[index]) {
        return index;
    }
    return data[index].id;
}

function Item({ index, data }: { index: number, data: Event.Event[], }) {
    const game = React.useContext(Game.Ctx);
    const editing = React.useContext(EditEventCtx);
    const gamePlayers = game?.players;

    if (!data[index]) {
        console.log(`log.item(ix=${index}, id=${data[index]?.id}): loading`);
        return <LoadingItem />;
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
        console.log(`log.item(ix=${index}, id=${data[index]?.id}): editing`);
        return <span>Editing #{index + 1} {event.ty} {event.id}</span>;
    }
    console.log(`log.item(ix=${index}, id=${data[index]?.id}): item`);
    return <span style={{ height: `${index + 1}rem` }}> Non editing item #{index + 1} {event.ty} {event.id}</span >;
};

export default function Log() {
    console.log(`log() render`);
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

    return (
        <LoadingAutosizeList loadedItems={event.events} loading={loading} load={handleLoad} itemKey={itemKey} loadElem={LoadingItem}>
            {Item}
        </LoadingAutosizeList>
    );
}
