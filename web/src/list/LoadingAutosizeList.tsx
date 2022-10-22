import * as React from 'react';

import ListItem from './ListItem';

// @ts-ignore For some reason, they did modules the wrong way for this libaray
import InfiniteLoader from "react-window-infinite-loader";
import { VariableSizeList as List, ListOnItemsRenderedProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import EventRecord from 'record/EventRecord';
import { prependOnceListener } from "process";

export type Props<T> = {
    loadedItems: T[],

    loading: boolean,
    load: (oldestIx: number) => void,

    itemKey: (index: number, data: T[]) => any,

    loadElem: () => JSX.Element,
    children: (index: number, data: T[]) => JSX.Element;
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

export function LoadingAutosizeList<T>({ loadedItems, loading, load, loadElem, children, itemKey }: Props<T>) {
    const listRef = React.useRef<InfiniteLoader | null>(null);
    const itemSizes = React.useRef<number[]>([]);

    const loadedCount = loadedItems.length;
    const itemCount = loadedItems.length + (loading ? 1 : 0);

    const loadedAt = (ix: number) => !loading || ix < itemCount;

    const itemSize = (index: number) => {
        if (itemSizes.current[index]) {
            return itemSizes.current[index] + 6;
        }
        return 0;
    };

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
    }, [loadedCount]);

    const setHeightAtIndex = (height: number, index: number) => {
        if (itemSizes.current[index] === height) {
            return;
        }
        itemSizes.current[index] = height;
        if (listRef.current && listRef.current._listRef) {
            listRef.current._listRef.resetAfterIndex(index);
        }
    }; // [itemSizes, listRef]

    const RenderRow = ({ index, data, style }: RowRenderProps<T>) => {
        console.log("renderRow @", index, style);
        const setHeight = (height: number) => setHeightAtIndex(height, index);

        if (!loadedAt(index)) {
            return <ListItem setHeight={setHeight} style={style}>{loadElem()}</ListItem>;
        }

        return <ListItem setHeight={setHeight} style={style}>{children(index, data)}</ListItem>;
    };

    return (
        <AutoSizer>
            {({ height, width }: { height: number, width: number; }) => (
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
            )}
        </AutoSizer>
    );
}
