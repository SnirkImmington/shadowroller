// @flow

import * as server from 'server';
import * as auth from './auth';
import { SetConnection, SetResponse } from 'connection';

export type RequestMode = "body" | "confirm";

export class BackendRequest {
    request: Request;
    handleSuccess: Promise;
    handleClientError: Promise;
    handleServerError: Promise;
    handleNetworkError: Promise;
    setConnection: SetConnection = () => {};
    setResponse: SetResponse = () => {};

    constructor(request: Request, mode: RequestMode) {
        this.request = request;
        this.request.then(response => {
            if (response.ok) {
                this.setConnection("connected");
                this.setResponse("success");
                this.handleSuccess(response.json());
            }
            if (response.code >= 400 && response.code < 500) {
                this.setConnection("errored");
                this.setResponse("badRequest");
                this.handleClientError(response);
            }
            else if (response.code >= 500) {
                this.setConnection("errored");
                this.setResponse("serverError");
                this.handleServerError(response);
            }
            else if (process.env.NODE_ENV !== "PRODUCTION") {
                console.error("No handler present for ", this.request, response);
                throw response;
            }
        })
        .catch(err => {
            this.setConnection("disconnected");
            this.setResponse("noConnection");
            if (this.handleNetworkError) {
                this.handleNetworkError(err);
            }
        })
    }

    onSuccess(handler: (any) => void): BackendRequest {
        this.handleSuccess = handler;
        return this;
    }

    onClientError(handler: (Request) => void): BackendRequest {
        this.handleClientError = handler;
        return this;
    }

    onServerError(handler: (Request) => void): BackendRequest {
        this.handleserverError = handler;
        return this;
    }

    onNetworkError(handler: (any) => void): BackendRequest {
        this.handleNetworkError = handler;
        return this;
    }

    onAnyError(handler: (any) => void): BackendRequest {
        this.handleClientError = handler;
        this.handleServerError = handler;
        this.handleNetworkError = handler;
        return this;
    }

    onDone(handler: (bool) => void): BackendRequest {
        this.onSuccess(_ => handler(true));
        this.onAnyError(_ => handler(false));
        return this;
    }

    onConnection(setter: SetConnection) {
        this.setConnection = setter;
        setter("connecting");
        return this;
    }

    onResponseStatus(setter: SetResponse) {
        this.setResponse = setter;
        return this;
    }
}

type FetchArgs = {
    method: string,
    path: string,
    body?: any,
    params?: { [string]: any }
};
function backendFetch({ method, path, body, params }: FetchArgs): Request {
    let url = server.BACKEND_URL + path;
    if (params) {
        url = `${url}?${new URLSearchParams(params).toString()}`;
    }

    let headers = Headers.new();
    if (auth.session) {
        headers.append("Authentication", `bearer ${auth.session}`);
    }
    else if (process.env.NODE_ENV !== "production") {
        console.log("Requesting", path, "with no auth.");
    }

    return fetch(url, {
        method,
        body,
        credentials: 'include',
        headers,
    });
}

export function get(path: string, params: ?{ [string]: any }): BackendRequest {
    const fetchRequest = backendFetch({ method: "get", path, params });
    return new BackendRequest(fetchRequest);
 }

 export function post(path: string, body: any): BackendRequest {
    const fetchRequest = backendFetch({ method: "post", path, body });
    return new BackendRequest(fetchRequest);
 }
