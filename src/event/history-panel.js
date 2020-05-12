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
import * as server from 'server';

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

type ListProps = { +events: Array<Event.Event> };
function RollResultList({ events }: ListProps) {

    function ListRow({ style, index }: RowRenderProps) {
        const event: Event.Event = events[index];
        return EventRecord({ event, style });
    }

    // This function is being inconsistent.
    function getItemSize(index: number): number {
        return 76;
        /*
        switch(events[index].ty) {
            case "localRoll":
            case "gameRoll":
                return 66;
            default:
                return 32;
        }*/
    }

    function itemKey(index, data) {
        return events[index].id;
    }

    return (
        <AutoSizer>
            {({ height, width }) => (
                <List height={height} width={width}
                      itemCount={events.length}
                      itemData={events} itemKey={itemKey}
                      itemSize={getItemSize}>
                    {ListRow}
                </List>
            )}
        </AutoSizer>
    );
}

function LoadingResultList() {
    const atEventEnd = false;
    const moreEventsLoading = false;
    const events = [];
    let loadNextEvents;

    const itemCount = !atEventEnd ? events.length + 1 : events.length;
    const loadMore = moreEventsLoading ? () => {} : loadNextEvents;

    // TODO this should take event ID into account.. we can do `<` on IDs though
    function loadedAt(index: number) { return atEventEnd || index < events.length; }

    function RenderRow({ index, style }) {
        if (index >= events.length) {
            return "loading";
        }
        else {
            const event = events[index];
            return <EventRecord event={event} style={style} />;
        }
    }

    return (
        <InfiniteLoader isItemLoaded={loadedAt}
                        itemCount={events.length}
                        loadMoreItems={moreEventsLoading ? () => {} : loadNextEvents}>
            {({ onItemsRendered, ref }) => (
                <AutoSizer>
                    {({ height, width }) => (
                        <List height={height} width={width}
                              itemCount={events.length}
                              itemSize={76}
                              onItemsRendered={onItemsRendered} ref={ref}>
                            {RenderRow}
                        </List>
                    )}
                </AutoSizer>
            )}
        </InfiniteLoader>

    );
}

const TitleBar = styled(UI.FlexRow)`
    width: 100%;
    justify-content: space-between;
`;

type Props = {
    +game: Game.State,
    +eventList: Event.List,
    +dispatch: Event.Dispatch,
    +connection: server.Connection,
    +setConnection: server.SetConnection
}
export default function EventHistory({ game, eventList, dispatch, connection, setConnection }: Props) {
    const gameID = game?.gameID;
    server.useEvents(gameID, setConnection, dispatch);

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
            <RollResultList events={eventList.events} />
        </UI.Card>
    );
}
