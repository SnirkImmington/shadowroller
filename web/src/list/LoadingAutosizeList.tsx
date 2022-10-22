import * as React from 'react';

import ListItem from './ListItem';

// @ts-ignore For some reason, they did modules the wrong way for this libaray
import InfiniteLoader from "react-window-infinite-loader";
import { VariableSizeList as List, ListOnItemsRenderedProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

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
    console.log(`lal(loading=${loading}, #items=${loadedItems.length}) render`);
    const listRef = React.useRef<InfiniteLoader | null>(null);
    const itemSizes = React.useRef<number[]>([]);

    const loadedCount = loadedItems.length;
    const itemCount = loadedItems.length + (loading ? 1 : 0);

    const loadedAt = React.useCallback(function loadedAt(ix: number) {
        console.log(`lal.loadedAt(${ix}) -> ${!loading || ix < itemCount}`);
        return !loading || ix < itemCount;
    }, [loading, itemCount]);

    const itemSize = React.useCallback(function itemSize(index: number) {
        if (itemSizes.current[index]) {
            console.log(`lal.size(ix=${index}) -> ${itemSizes.current[index]}`);
            return itemSizes.current[index];
        }
        console.log(`lal.size(ix=${index}) not found (0)`);
        return 0;
    }, [itemSizes, itemCount]);


    // Once we've connected this ref to the list,
    // we want to ask the list to stop caching the item sizes whenever we push
    // new items to the top! This gets re-done when we push items to the bottom,
    // but that's okay. And when we are pushing items to the top, it's just
    // recalculating the first ~9.
    React.useEffect(() => {
        if (listRef?.current?._listRef) {
            console.log(`lal.effect(loaded=${loadedCount}): resetAfterIndex`);
            listRef.current._listRef.resetAfterIndex(0);
        }
        else {
            console.log(`lal.effect(loaded=${loadedCount})`);
            let timeout = setTimeout(function resetLength() {
                if (listRef.current?._listRef) {
                    console.log(`lal.effect(loaded=${loadedCount}): from timeout: resetAfterIndex`);
                    listRef.current._listRef.resetAfterIndex(0);
                }
                else {
                    timeout = setTimeout(resetLength);
                }
            });
            return () => clearTimeout(timeout);
        }
    }, [loadedCount]);


    const setHeightAtIndex = React.useCallback(
        function setHeightAtIndex(height: number, index: number) {
            if (itemSizes.current[index] === height) {
                console.log(`lal.setHeight(ix=${index} h=${height}): skip update`);
                return;
            }
            itemSizes.current[index] = height;
            if (listRef.current && listRef.current._listRef) {
                console.log(`lal.setHeight(ix=${index} h=${height}): reset after ${index}`);
                listRef.current._listRef.resetAfterIndex(index);
            } else {
                console.log(`lal.setHeight(ix=${index}, h=${height}): unable to reset`);
            }
        },
        [itemSizes, listRef]
    );

    const RenderRow = React.useCallback(function RenderRow({ index, data, style }: RowRenderProps<T>) {
        const setHeight = React.useCallback((height: number) => setHeightAtIndex(height, index), [setHeightAtIndex, index]);

        if (!loadedAt(index)) {
            console.log(`lal.row(ix=${index}, id=${(data[index] as any)?.id}, h=${style.height}): not loaded`);
            return <ListItem setHeight={setHeight} style={style}>{loadElem()}</ListItem>;
        }
        // Need to nest properly here to prevent rendering out of order.
        console.log(`lal.row(ix=${index}, id=${(data[index] as any)?.id}, h=${style.height}): loaded`);
        return <ListItem setHeight={setHeight} style={style}>{children(index, data)}</ListItem>;
    }, [setHeightAtIndex, loadElem, children]);

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
