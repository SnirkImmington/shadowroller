// @flow

import * as React from 'react';

type Request = {
    data: ?Object,
    error: ?Object,
    isLoading: bool,
    hasTriggered: bool,
    promise: Object,
}

function useServer(url: string, params: Object[], initialData: ?Object = null): Request {
    const [data, setData] = React.useState(initialData);
    const [error, setError] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasTriggered, setHasTriggered] = React.useState(false);
    const [promise, setPromise] = React.useState(null);

    React.useEffect(() => {
        if (hasTriggered) {
            return;
        }

        setIsLoading(true);
        setHasTriggered(true);

        setPromise(
            fetch("some URL, params")
            .then(response => {
                setData(response);
                setError(null);
                setIsLoading(false);
            })
            .catch(error => {
                setData(null);
                setError(error);
                setIsLoading(false);
            })
        );
    }, [url, params, promise, hasTriggered]);

    return {
        data: data,
        error: error,
        isLoading: isLoading,
        hasTriggered: hasTriggered,
        promise: promise,
    }
}
