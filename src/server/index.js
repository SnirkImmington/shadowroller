// @flow

import * as React from 'react';

import { GameCtx } from 'game/state';

const BACKEND_URL = process.env.NODE_ENV !== 'production' ?
    'localhost:3001/' : 'https://shadowroller.immington.industries/';

type ServerRequest = {
    +data: ?Object,
    +error: ?Object,
    +isLoading: bool,
    +hasTriggered: bool,
    +promise: Object,
}

export function backendGet(resource: string, body: Object): Response {
    const url = BACKEND_URL + resource;
}

export function useServer(method: string, resource: string, params: Object[]): ServerRequest {
    const url = BACKEND_URL + resource;
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasTriggered, setHasTriggered] = React.useState(false);
    const [promise, setPromise] = React.useState(null);
    const gameState = React.useContext(GameCtx);

    console.log('useServer: pre-effect:');
    React.useEffect(() => {
        if (hasTriggered) {
            console.log('useServer: has triggered.');
            return;
        }

        if (!gameState) {
            console.log('useServer: no game state.');
            setData(null);
            setError("Not connected to a game");
            setIsLoading(false);
            setHasTriggered(true);
            setPromise(null);
            return;
        }
        const request = new Request(url);
        const headers = new Headers();
        headers.set("Authentication", gameState.gameToken);

        setIsLoading(true);
        setHasTriggered(true);
        setPromise(
            fetch(request, {
                method: method,
                headers: headers,
                // credentials: ???
                // body
            })
            .then(response => { // just chain the .json
                console.log('Response received!');
                response.json().then(json => {
                    setIsLoading(false);
                    if (response.ok) {
                        console.log('Response ok!');
                        setData(json);
                        setError(null);
                    }
                    else {
                        console.log('Response error!');
                        setError(json);
                        setData(null);
                    }
                });
            })
            .catch(error => {
                console.log('Response catch!');
                setIsLoading(false);
                setData(null);
                setError(error);
            })
        );
        console.log('Request begun.');
    }, [gameState, url, method, params, promise, hasTriggered]);
    console.log('useServer: done effect.');

    return {
        data: data,
        error: error,
        isLoading: isLoading,
        hasTriggered: hasTriggered,
        promise: promise,
    }
}
