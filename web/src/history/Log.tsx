import * as React from "react";

import * as Event from 'event';
import * as Game from 'game';
import { ConnectionCtx } from 'connection';
import * as server from 'server';
import * as routes from 'routes';
import { EditEventCtx } from './EditingState';
import { LoadingAutosizeList } from "list/LoadingAutosizeList";

function LoadingItem() {
    return <>Loading...</>;
}

export default function Log() {
    const game = React.useContext(Game.Ctx);
    const event = React.useContext(Event.Ctx);
    const editing = React.useContext(EditEventCtx);

    const eventDispatch = React.useContext(Event.DispatchCtx);
    const connection = React.useContext(ConnectionCtx);

    const finishedLoading = event.historyFetch === "finished";
    const loading = event.historyFetch === "fetching";

    function handleLoad(oldestIx: number) {

    }

    function itemKey(index: number, data: Event.Event[]) {
        if (!data || !data[index]) {
            return index;
        }
        return data[index].id;
    }

    const Item = React.useCallback(function Item(index: number, data: Event.Event[]) {
        if (!data[index]) {
            console.log("Attempt to render item when loading!");
            return <LoadingItem />;
        }
        const event = data[index];
        if (editing === event.id) {
            return <>"Editing item"</>;
        }
        return <>"Non editing item</>;
    }, [editing]);

    return (
        <LoadingAutosizeList loadedItems={event.events} loading={loading} load={handleLoad} itemKey={itemKey} loadElem={LoadingItem}>
            {Item}
        </LoadingAutosizeList>
    );
}
