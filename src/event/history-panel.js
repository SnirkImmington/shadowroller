// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';

import * as Game from 'game';
import * as Event from 'event';
import * as Records from 'event/record';
import * as server from 'server';
import * as srutil from 'srutil';
import { ConnectionCtx, SetConnectionCtx } from 'connection';

const DO_SOME_ROLLS_FLAVOR = [
    "You have to press that roll button first, chummer.",
    "You gotta roll those dice first.",
    "Hit that roll button and we'll show you the glitches."
];

type RecordProps = { +event: Event.Event, style?: any };
function EventRecord({ event, style }: RecordProps) {
    switch (event.ty) {
        case "localRoll": return <Records.LocalRollRecord event={event} style={style} />;
        case "gameRoll": return <Records.GameRollRecord event={event} style={style} />;
        case "playerJoin": return <Records.PlayerJoinRecord event={event} style={style} />;
        default:
            (event: empty); // eslint-disable-line no-unused-expressions
            return '';
    }
}

type RowRenderProps = { +style: any, +index: number };

export function LoadingResultList() {
    const state = React.useContext(Event.Ctx);
    const dispatch = React.useContext(Event.DispatchCtx);
    const connection = React.useContext(ConnectionCtx);
    const atHistoryEnd = state.historyFetch === "finished";
    const fetchingEvents = state.historyFetch === "fetching";
    const eventsLength = state.events.length;
    const itemCount = eventsLength + (
        atHistoryEnd || connection === "offline" || connection === "disconnected" ? 0 : 1);

    const listRef = React.useRef(null);

    // Once we've connected this ref to the list,
    // we want to ask the list to stop caching the item sizes whenever we push
    // new items to the top! This gets re-done when we push items to the bottom,
    // but that's okay. And when we are pushing items to the top, it's just
    // recalculating the first ~9.
    React.useEffect(() => {
        if (listRef.current && listRef.current._listRef) {
            console.log('List ref', listRef.current._listRef);
            listRef.current._listRef.resetAfterIndex(0);
        }
    }, [ eventsLength ]);

    // TODO this should take event ID into account.. we can do `<` on IDs though
    const loadedAt = React.useCallback((index: number) => {
        return index < eventsLength || atHistoryEnd;
    }, [atHistoryEnd, eventsLength]);

    const itemSize = React.useMemo(() => (index: number) => {
        if (index >= eventsLength) {
            return 40;
        }
        const event = state.events[index];
        switch (event.ty) {
            case "localRoll":
            case "gameRoll":
                return 96;
            default:
                return 40;
        }
    }, [eventsLength, state.events]);

    let RenderRow = React.useMemo(() => ({ index, style }: RowRenderProps) => {
        if (!loadedAt(index)) {
            return <Records.EventsLoadingIndicator style={style} />;
        }
        else {
            const event = state.events[index];
            return <EventRecord event={event} style={style} />;
        }
    }, [loadedAt, state.events]);

    function loadMoreItems(oldestIx: number): ?Promise<void> {
        if (fetchingEvents || connection === "offline") {
            return;
        }
        dispatch({ ty: "setHistoryFetch", state: "fetching" });
        const event = state.events[oldestIx - 1];
        if (!event) {
            return;
        }
        const oldestID = event.id ? event.id : `${new Date().valueOf()}-0`;
        const eventFetch = server.fetchEvents({ oldest: oldestID }).then(resp => {
            dispatch({ ty: "setHistoryFetch", state: resp.more ? "ready" : "finished" });
            dispatch({ ty: "mergeEvents", events: resp.events });
        });
        if (process.env.NODE_ENV !== 'production') {
            eventFetch.catch(err => console.error('Error fetching events: ', err));
        }
    }

    return (
        <AutoSizer>
            {({height, width}) => (
                <InfiniteLoader
                    ref={listRef}
                    itemCount={itemCount}
                    isItemLoaded={loadedAt}
                    loadMoreItems={loadMoreItems}>
                    {({ onItemsRendered, ref}) => (
                        <List height={height} width={width}
                              itemCount={itemCount}
                              itemSize={itemSize}
                              style={{overflowY: 'scroll'}}
                              onItemsRendered={onItemsRendered} ref={ref}>
                            {RenderRow}
                        </List>
                    )}
                </InfiniteLoader>
            )}
        </AutoSizer>

    );
}

const TitleBar = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

const HistoryFlavor = styled(UI.Flavor)`
    margin: 1em auto;
`;

export default function EventHistory() {
    const game = React.useContext(Game.Ctx);
    const events = React.useContext(Event.Ctx);
    const dispatch = React.useContext(Event.DispatchCtx);
    // Using connection is what lets us rerender when events DC
    const setConnection = React.useContext(SetConnectionCtx);

    const [rollFlavor] = srutil.useFlavor(DO_SOME_ROLLS_FLAVOR);
    const gameID = game?.gameID;
    const hasRolls = events.events.length > 0;
    server.useEvents(gameID, setConnection, dispatch);

    let title;
    if (game) {
        title = gameID;
    }
    else {
        title = "Results";
    }

    return (
        <UI.Card grow color="#81132a">
            <TitleBar>
                <UI.CardTitleText color="#842222">{title}</UI.CardTitleText>
            </TitleBar>
            {hasRolls ?
                <LoadingResultList />
                : <HistoryFlavor>{rollFlavor}</HistoryFlavor>
            }
        </UI.Card>
    );
}
