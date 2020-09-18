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
import { ConnectionCtx } from 'connection';

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

type RecordProps = { +event: ?Event.Event, +eventIx: number, style?: any };
const EventRecord = React.memo<RecordProps>(function EventRecord({ event, eventIx, style }) {
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
        case "rerollFailures":
            inner = (<Record.RollRecord event={event} eventIx={eventIx} />);
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

type RowRenderProps = { +style: any, +index: number, +data: Event.Event[] };

export function LoadingResultList({ playerID }: { playerID: ?string }) {
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
    const loadedAt = React.useCallback((index: number): bool => {
        return index < eventsLength || atHistoryEnd;
    }, [atHistoryEnd, eventsLength]);

    const itemSize = React.useCallback((index: number): number => {
        if (index >= eventsLength) {
            return 34;
        }
        const event = state.events[index];
        switch (event.ty) {
            case "localRoll":
            case "gameRoll":
            case "edgeRoll":
            case "roll":
                if (Event.canModify(event, playerID)) {
                    return 112;
                }
                return Event.wouldScroll(event) ? 98 : 90;
            case "rerollFailures":
                return Event.wouldScroll(event) ? 98 : 90;
            default:
                return 34;
        }
    }, [playerID, eventsLength, state.events]);

    function itemKey(index: number, data: Event.Event[]): any {
        if (!data || !data[index]) {
            return index;
        }
        return data[index].id;
    }

    let RenderRow = React.useMemo(() => ({ index, data, style }: RowRenderProps) => {
        if (!loadedAt(index)) {
            return <EventRecord event={null} eventIx={index} style={style} />;
        }
        else {
            const event = data[index];
            return <EventRecord event={event} eventIx={index} style={style} />;
        }
    }, [loadedAt]);

    function loadMoreItems(oldestIx: number): ?Promise<void> {
        if (fetchingEvents || connection === "offline") {
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
            {({height, width}) => (
                <InfiniteLoader
                    ref={listRef}
                    itemCount={itemCount}
                    isItemLoaded={loadedAt}
                    loadMoreItems={loadMoreItems}>
                    {({ onItemsRendered, ref}) => (
                        <List height={height} width={width}
                              itemCount={itemCount}
                              itemKey={itemKey}
                              itemData={state.events}
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

    const [rollFlavor] = srutil.useFlavor(DO_SOME_ROLLS_FLAVOR);
    const [emptyGameFlavor] = srutil.useFlavor(GAME_EMPTY_FLAVOR);

    const hasRolls = events.events.length > 0;

    let title = "Results";
    if (game?.gameID) {
        title = game.gameID;
    }

    let body = '';
    if (!hasRolls && game && events.historyFetch === "finished") {
        body = (<HistoryFlavor>{emptyGameFlavor}</HistoryFlavor>);
    }
    else if (!hasRolls && !game) {
        body = (<HistoryFlavor>{rollFlavor}</HistoryFlavor>);
    }
    else {
        body = (<LoadingResultList playerID={game?.player?.id} />);
    }

    return (
        <UI.Card grow color="#81132a">
            <TitleBar>
                <UI.CardTitleText color="#842222">
                    {title}
                    {events.historyFetch === "fetching" && "..."}
                </UI.CardTitleText>
            </TitleBar>
            {body}
        </UI.Card>
    );
}
