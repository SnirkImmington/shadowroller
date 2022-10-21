import * as React from 'react';

import * as Event from 'event';
import * as Game from 'game';
import { ConnectionCtx } from 'connection';
import * as server from 'server';
import * as routes from 'routes';
import { EditEventCtx, SetEditEventCtx } from './EditingState';

// @ts-ignore For some reason, they did modules the wrong way for this libaray
import InfiniteLoader from "react-window-infinite-loader";
import { VariableSizeList as List, ListOnItemsRenderedProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import EventRecord from 'record/EventRecord';

type RowRenderProps = { style: any, index: number, data: Event.Event[] };

/** Unique React key prop for the event record at the given index */
function itemKey(index: number, data: Event.Event[]): any {
    if (!data || !data[index]) {
        return index;
    }
    return data[index].id;
}
export function LoadingResultList({ playerID }: { playerID: string | null }) {
    const game = React.useContext(Game.Ctx);
    const state = React.useContext(Event.Ctx);
    const inlineEdit = React.useContext(EditEventCtx);
    const setInlineEdit = React.useContext(SetEditEventCtx);
    const dispatch = React.useContext(Event.DispatchCtx);
    const connection = React.useContext(ConnectionCtx);

    const atHistoryEnd = state.historyFetch === "finished";
    const fetchingEvents = state.historyFetch === "fetching";
    const eventsLength = state.events.length;
    const itemCount = eventsLength + (
        atHistoryEnd || connection === "offline" || connection === "disconnected" ? 0 : 1);

    const listRef = React.useRef<InfiniteLoader|null>(null);
    const itemSizes = React.useRef<number[]>([]);

    // Once we've connected this ref to the list,
    // we want to ask the list to stop caching the item sizes whenever we push
    // new items to the top! This gets re-done when we push items to the bottom,
    // but that's okay. And when we are pushing items to the top, it's just
    // recalculating the first ~9.
    React.useEffect(() => {
        if (listRef?.current?._listRef) {
            listRef.current._listRef.resetAfterIndex(0);
        }
        else {
            let timeout = setTimeout(function resetLength() {
                if (listRef.current?._listRef) {
                    listRef.current._listRef.resetAfterIndex(0);
                }
                else {
                    timeout = setTimeout(resetLength);
                }
            });
            return () => clearTimeout(timeout);
        }
    }, [eventsLength]);

    const loadedAt = React.useCallback(function loadedAt(index: number): boolean {
        return index < eventsLength || atHistoryEnd;
    }, [atHistoryEnd, eventsLength]);

    const itemSize = React.useCallback(function itemSize(index: number): number {
        if (itemSizes.current[index]) {
            return itemSizes.current[index] + 6;
        }
        return 0;
    }, [itemSizes]);


    const setIndexHeight = React.useCallback(function setIndexHeight(height: number, index: number) {
        console.log("set height at index", index, "to", height);
        if (itemSizes.current[index] === height) {
            return;
        }
        itemSizes.current[index] = height;
        if (listRef.current && listRef.current._listRef) {
            listRef.current._listRef.resetAfterIndex(index);
        }
    }, [itemSizes, listRef]);

    const gamePlayers = game?.players;
    let RenderRow = React.useMemo(() => ({ index, data, style }: RowRenderProps) => {
        const setHeight = (height: number) => setIndexHeight(height, index);

        if (!loadedAt(index)) {
            return <EventRecord event={null} hue={null} setHeight={setHeight} playerID={playerID} style={style} />;
        }
        const event = data[index];
        const editing = inlineEdit === event.id;
        let hue = null;
        let noActions = event.source !== "local";
        if (gamePlayers && event.source !== "local") {
            const player = gamePlayers.get(event.source.id);
            if (player) {
                hue = player.hue;
                noActions = !Event.canModify(event, player.id);
            }
        }
        return <EventRecord {...{ event, hue, editing, setHeight, noActions, style, playerID }} />;
    }, [loadedAt, playerID, inlineEdit, gamePlayers, setIndexHeight]);

    function loadMoreItems(oldestIx: number): Promise<void> | undefined {
        if (fetchingEvents || connection === "offline" || atHistoryEnd) {
            return;
        }
        const event = state.events[oldestIx - 1];
        if (!event) {
            return;
        }
        dispatch({ ty: "setHistoryFetch", state: "fetching" });
        const oldestID = event.id ? event.id : Date.now().valueOf();
        routes.game.getEvents({ newest: oldestID })
            .onResponse(resp => {
                dispatch({
                    ty: "setHistoryFetch",
                    state: resp.more ? "ready" : "finished"
                });
                resp.events.forEach(server.normalizeEvent);
                dispatch({ ty: "mergeEvents", events: resp.events });
            })
            .onAnyError(err => {
                if (process.env.NODE_ENV !== 'production') {
                    console.error('Error fetching events: ', err);
                }
                dispatch({
                    ty: "setHistoryFetch",
                    state: "finished",
                })
            });
    }
    return (
        <AutoSizer>
            {({height, width} : { height: number, width: number }) => (
                <InfiniteLoader
                    ref={listRef}
                    itemCount={itemCount}
                    isItemLoaded={loadedAt}
                    loadMoreItems={loadMoreItems}>
                    {({ onItemsRendered, ref}: { onItemsRendered: (props: ListOnItemsRenderedProps) => any, ref: any }) => (
                        <List height={height} width={width}
                              itemCount={itemCount}
                              itemKey={itemKey}
                              itemData={state.events}
                              itemSize={itemSize}
                              style={{overflowY: 'scroll'}}
                              className="scrollable"
                              onItemsRendered={onItemsRendered} ref={ref}>
                            {RenderRow}
                        </List>
                    )}
                </InfiniteLoader>
            )}
        </AutoSizer>
    );
}
