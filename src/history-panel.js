// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
import * as UI from 'style';

import { VariableSizeList as List, areEqual } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';
import EditEvent from 'edit-event';

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

type RecordProps = {
    +event: ?Event.Event,
    +playerID: ?string,
    +setHeight: (number) => void,
    +noActions?: boolean,
    +editing?: boolean,
    style?: any
};
export const EventRecord = React.memo<RecordProps>(function EventRecord(props) {
    const { event, playerID, setHeight, noActions, editing, style } = props;

    const ref = React.useRef<?Element>();
    React.useEffect(() => {
        if (ref.current) {
            setHeight(ref.current.getBoundingClientRect().height);
        }
    }, [ref, setHeight]);
    if (!event) {
        return (
            <Record.StyledRecord color="white" style={style}>
                {/* flow-ignore-all-next-line No, this ref is fine, thanks */}
                <Record.Loading ref={ref}/>
            </Record.StyledRecord>
        );
    }

    let Inner;
    const color = event.source === "local" ? "slategray" : srutil.hashedColor(event.source.id);

    switch (event.ty) {
        case "playerJoin":
            Inner = Record.PlayerJoin;
            break;
        case "edgeRoll":
            Inner = Record.EdgeRoll;
            break;
        case "rerollFailures":
            Inner = Record.Reroll;
            break;
        case "roll":
            Inner = Record.Roll;
            break;
        case "initiativeRoll":
            Inner = Record.Initiative;
            break;
        default:
            (event: empty); // eslint-disable-line no-unused-expressions
            return '';
    }
    return (
        <Record.StyledRecord color={color} editing={editing} style={style}>
            {/* flow-ignore-all-next-line We do pass the events properly here */}
            <Inner ref={ref} playerID={playerID} event={event} noActions={noActions} />
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
    const itemSizes = React.useRef([]);

    // Once we've connected this ref to the list,
    // we want to ask the list to stop caching the item sizes whenever we push
    // new items to the top! This gets re-done when we push items to the bottom,
    // but that's okay. And when we are pushing items to the top, it's just
    // recalculating the first ~9.
    React.useEffect(() => {
        if (listRef.current && listRef.current._listRef) {
            listRef.current._listRef.resetAfterIndex(0);
        }
        else {
            setTimeout(function resetLength() {
                console.log("Resetting length...");
                if (listRef.current && listRef.current._listRef) {
                    listRef.current._listRef.resetAfterIndex(0);
                }
                else {
                    setTimeout(resetLength);
                }
            })
        }
    }, [eventsLength]);

    // TODO this should take event ID into account.. we can do `<` on IDs though
    const loadedAt = React.useCallback((index: number): bool => {
        return index < eventsLength || atHistoryEnd;
    }, [atHistoryEnd, eventsLength]);

    const itemSize = (index: number): number => {
        if (itemSizes.current[index]) {
            return itemSizes.current[index] + 6;
        }
        return 0;
    };

    function itemKey(index: number, data: Event.Event[]): any {
        if (!data || !data[index]) {
            return index;
        }
        return data[index].id;
    }

    function setIndexHeight(height: number, index) {
        if (itemSizes.current[index] === height) {
            return;
        }
        itemSizes.current[index] = height;
        if (listRef.current && listRef.current._listRef) {
            listRef.current._listRef.resetAfterIndex(index);
        }
    }

    let RenderRow = React.useMemo(() => ({ index, data, style }: RowRenderProps) => {
        const setHeight = (height) => setIndexHeight(height, index);
        if (!loadedAt(index)) {
            return <EventRecord event={null} setHeight={setHeight} playerID={playerID} style={style} />;
        }
        else {
            const event = data[index];
            const editing = state.editing != null && state.editing.id === event.id;
            return <EventRecord event={event} editing={editing} setHeight={setHeight} playerID={playerID} style={style} />;
        }
    }, [loadedAt, playerID, state.editing]);

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
        <>
        {events.editing &&
            <EditEvent playerID={game?.player?.id} event={events.editing} />
        }
        <UI.Card padRight grow color="#81132a">
            <UI.FlexRow maxWidth rowCenter>
                <UI.CardTitleText color="#842222" style={{ marginRight: '0.5rem'}}>
                    {title}
                    {events.historyFetch === "fetching" && "..."}
                </UI.CardTitleText>
            </UI.FlexRow>
            {body}
        </UI.Card>
        </>
    );
}
