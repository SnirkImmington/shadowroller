// @flow

declare module 'react-window-infinite-loader' {
    declare export default function InfiniteLoader(props: InfiniteLoaderProps): React.Node;

    declare type InfiniteLoaderProps = {
        +children: ({ onItemsRendered: Function, ref: React.Ref } => React.Node),
        +isItemLoaded: (index: number) => bool,
        +itemCount: number,
        +loadMoreItems: (startIndex: number, stopIndex: number) => ?Promise<any>,
        +minimumBatchSize?: number,
        +threshold?: number,
    };
}
