// @flow

import * as React from 'react';
import styled from 'styled-components/macro';
//import type { StyledComponent } from 'styled-components';
import * as UI from 'style';

import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import AutoSizer from 'react-virtualized-auto-sizer';

import * as Game from 'game';
import * as Event from 'event';
import * as Records from 'event/record';
import * as Server from 'server';

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

type LoadingListProps = {
    +state: Event.State,
    +connection: Server.Connection,
    +dispatch: Event.Dispatch,
};
export function LoadingResultList({ state, connection, dispatch }: LoadingListProps) {
    console.log("LoadingResultList", arguments[0]);
    const atHistoryEnd = state.historyFetch === "finished";
    const fetchingEvents = state.historyFetch === "fetching";
    const itemCount = state.events.length + (atHistoryEnd || connection === "offline" ? 0 : 1);

    // TODO this should take event ID into account.. we can do `<` on IDs though
    function loadedAt(index: number) {
        return index < state.events.length || atHistoryEnd;
    }

    function RenderRow({ index, style }: RowRenderProps) {
        if (!loadedAt(index)) {
            if (connection === "offline") {
                return (
                    <div style={style}>
                        ---
                    </div>
                );
            }
            return (
                <div style={style}>
                    Loading... <UI.DiceSpinner />
                </div>
            );
        }
        else {
            //console.log("Render at", index, state.events[index], style);
            const event = state.events[index];
            return <EventRecord event={event} style={style} />;
        }
    }

    function loadMoreItems(oldestIx: number): ?Promise<void> {
        console.log("LoadMoreItems: ", oldestIx);
        if (fetchingEvents) {
            console.log("> We're already loading more items, nothing to do.");
            return;
        }
        if (connection === "offline") {
            console.log("> We're offline!");
            return;
        }
        console.log("> Gonna load more items!!!");
        dispatch({ ty: "setHistoryFetch", state: "fetching" });
        const event = state.events[oldestIx - 1];
        if (!event) {
            console.log("> There's no event for ", oldestIx);
            return;
        }
        const oldestID = event.id ? event.id : `${new Date().valueOf()}-0`;
        console.log("The oldest ID we know of is", oldestID);
        Server.fetchEvents({ oldest: oldestID }).then(resp => {
            dispatch({ ty: "setHistoryFetch", state: resp.more ? "ready" : "finished" });
            dispatch({ ty: "mergeEvents", events: resp.events });
        });
    }

    return (
        <AutoSizer>
            {({height, width}) => (
                <InfiniteLoader
                    itemCount={itemCount}
                    isItemLoaded={loadedAt}
                    loadMoreItems={loadMoreItems}>
                    {({ onItemsRendered, ref}) => (
                        <List height={height} width={width}
                              itemCount={itemCount}
                              itemSize={() => 76}
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

type Props = {
    +game: Game.State,
    +eventList: Event.State,
    +dispatch: Event.Dispatch,
    +connection: Server.Connection,
    +setConnection: Server.SetConnection,
}
export default function EventHistory({ game, eventList, dispatch, connection, setConnection }: Props) {
    const gameID = game?.gameID;
    Server.useEvents(gameID, setConnection, dispatch);

    let title, right;
    if (game) {
        title = gameID;
        right = <UI.HashColored id={game.player.id}>{game.player.name}</UI.HashColored>;
    }
    else {
        title = "Results";
    }

    return (
        <UI.Card grow color="#81132a">
            <TitleBar>
                <UI.CardTitleText color="#842222">{title}</UI.CardTitleText>
                <span style={{fontSize: '1.1rem'}}>{right}</span>
            </TitleBar>
            <LoadingResultList
                state={eventList} dispatch={dispatch}
                connection={connection} />
        </UI.Card>
    );
}
