// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import { VariableSizeList as List, areEqual } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';

import * as Game from 'game';
import * as Event from 'event';
import * as Record from 'record';
import * as server from 'server';
import routes from 'routes';
import * as srutil from 'srutil';
import { ConnectionCtx, SetConnectionCtx } from 'connection';

const DO_SOME_ROLLS_FLAVOR = [
    "You have to press that roll button first, chummer.",
    "You gotta roll those dice first.",
    "Hit that roll button and we'll show you the glitches."
];

const GAME_EMPTY_FLAVOR = [
    "Looks like nothing much has happened here.",
    "Looks like you've joined a really boring game.",
    "Be the first one to roll!",
];

type RecordProps = { +event: ?Event.Event, style?: any };
const EventRecord = React.memo<RecordProps>(function EventRecord({ event, style }) {
    if (!event) {
        return (
            <Record.StyledRecord color="white" style={style}>
                <Record.Loading />
            </Record.StyledRecord>
        );
    }
    let inner: React.Node;
    const color = event.source === "local" ? "slategray" : srutil.hashedColor(event.source.id);
    switch (event.ty) {
        case "playerJoin":
            inner = (<Record.PlayerJoin event={event} style={style} />);
            break;
        case "edgeRoll":
        case "roll":
            inner = (<Record.RollRecord event={event} eventIx={0} />);
            break;
        default:
            (event: empty); // eslint-disable-line no-unused-expressions
            return '';
    }
    return (
        <Record.StyledRecord color={color} style={style}>
            {inner}
        </Record.StyledRecord>
    );
}, areEqual);

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
            listRef.current._listRef.resetAfterIndex(0);
        }
    }, [eventsLength]);

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
            case "edgeRoll":
            case "roll":
                return 96;
            default:
                return 40;
        }
    }, [eventsLength, state.events]);

    let RenderRow = React.useMemo(() => ({ index, style }: RowRenderProps) => {
        if (!loadedAt(index)) {
            return <EventRecord event={null} style={style} />;
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
        const event = state.events[oldestIx - 1];
        if (!event) {
            return;
        }
        dispatch({ ty: "setHistoryFetch", state: "fetching" });
        const oldestID = event.id ? event.id : `${new Date().valueOf()}-0`;
        routes.game.getEvents({ oldest: oldestID })
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
            });
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
    const setConnection = React.useContext(SetConnectionCtx);

    const [rollFlavor] = srutil.useFlavor(DO_SOME_ROLLS_FLAVOR);
    const [emptyGameFlavor] = srutil.useFlavor(GAME_EMPTY_FLAVOR);

    const gameID = game?.gameID;
    const hasRolls = events.events.length > 0;
    server.useEvents(gameID, server.session, setConnection, dispatch);

    let title;
    if (gameID) {
        title = gameID;
    }
    else {
        title = "Results";
    }

    let body = '';
    if (!hasRolls && game && events.historyFetch === "finished") {
        body = (<HistoryFlavor>{emptyGameFlavor}</HistoryFlavor>);
    }
    else if (!hasRolls && !game) {
        body = (<HistoryFlavor>{rollFlavor}</HistoryFlavor>);
    }
    else {
        body = (<LoadingResultList />);
    }

    return (
        <UI.Card grow color="#81132a">
            <TitleBar>
                <UI.CardTitleText color="#842222">{title}</UI.CardTitleText>
            </TitleBar>
            {body}
        </UI.Card>
    );
}
