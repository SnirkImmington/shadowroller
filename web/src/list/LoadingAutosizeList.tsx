import * as React from 'react';

import ListItem from './ListItem';

// @ts-ignore For some reason, they did modules the wrong way for this libaray
import InfiniteLoader from "react-window-infinite-loader";
import { VariableSizeList as List, ListOnItemsRenderedProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { roll } from "routes/game";

export type Props<T> = {
    loadedItems: T[],

    loading: boolean,
    load: (oldestIx: number) => void,

    itemKey: (index: number, data: T[]) => any,

    loadElem: () => JSX.Element,
    children: (props: { index: number, data: T[], }) => JSX.Element;
};

type InnerProps = {
    onItemsRendered: (props: ListOnItemsRenderedProps) => any,
    ref: any;
};

type RowRenderProps<T> = {
    index: number,
    data: T[];
    style: any,
};

const ITEM_SIZE = {
    initiative: 53,
    initiativeEdit: 127,
    roll: 93,
    rollSecondChance: 141,
    pushSmall: 115,
}

export function LoadingAutosizeList<T>({ loadedItems, loading, load, loadElem, children, itemKey }: Props<T>) {
    const listRef = React.useRef<InfiniteLoader | null>(null);
    const itemSizes = React.useRef<number[]>([]);

    const itemCount = loadedItems.length + (loading ? 1 : 0);

    // Changes too frequently to memoize - changes when itemCount changes
    function loadedAt(ix: number) {
        return !loading || ix < itemCount;
    }

    // Consistent between renders - accesses data from refs
    const itemSize = React.useCallback(function itemSize(index: number) {
        if (itemSizes.current[index]) {
            return itemSizes.current[index];
        }
        return 0;
    }, []);

    // Consistent between renders - accesses data from refs
    const setHeightAtIndex = React.useCallback(
        function setHeightAtIndex(height: number, index: number) {
            if (itemSizes.current[index] === height) {
                return;
            }
            itemSizes.current[index] = height;
            // Propagate this height change to the windowing library.
            // For new entries being inserted, this is called with the final index in the list
            if (listRef.current && listRef.current._listRef) {
                listRef.current._listRef.resetAfterIndex(index);
            } else {
                setTimeout(function reset() {
                    if (listRef.current && listRef.current._listRef) {
                        listRef.current._listRef.resetAfterIndex(index);
                    } else {
                        setTimeout(reset, 500);
                    }
                }, 120);
            }
        },
        [itemSizes, listRef]
    );

    // Should be consistent between renders, only uses other memoizeable functions
    // Changes too frequently to memoize since it relies on loadedAt.
    function RenderRow({ index, data, style }: RowRenderProps<T>) {
        const setHeight = React.useCallback((height: number) => setHeightAtIndex(height, index), [index]);

        if (!loadedAt(index)) {
            return (
                <ListItem setHeight={setHeight} style={style}>
                    {loadElem()}
                </ListItem>
            );
        }
        // Need to nest properly here to prevent rendering out of order.
        return (
            <ListItem setHeight={setHeight} style={style}>
                {children({ index, data })}
            </ListItem>
        );
    }

    // Changes based on all of the props, not worth trying to memoize
    const Child = ({ height, width }: { height: number, width: number, }) => (
        <InfiniteLoader ref={listRef}
            itemCount={itemCount}
            isItemLoaded={loadedAt}
            loadMoreItems={load}>
            {({ onItemsRendered, ref }: InnerProps) => (
                <List height={height} width={width}
                    itemCount={itemCount}
                    itemKey={itemKey}
                    itemData={loadedItems}
                    itemSize={itemSize}
                    className="scrollable"
                    onItemsRendered={onItemsRendered}
                    ref={ref}>
                    {RenderRow}
                </List>
            )}
        </InfiniteLoader>

    );

    return (
        <AutoSizer>
            {Child}
        </AutoSizer>
    );
}
