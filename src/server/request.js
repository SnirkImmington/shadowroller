// @flow

import * as server from 'server';
import * as auth from './auth';
import type { SetConnection, SetResponse } from 'connection';

export class BackendRequest<O> {
    request: Promise<Response>;
    handleSuccess: (bool, Response) => void;
    handleResponse: (O, Response) => void;
    handleClientError: (Response) => void = () => {};
    handleServerError: (Response) => void = () => {};
    handleNetworkError: (any) => void = () => {};
    setConnection: SetConnection = () => {};
    setResponse: SetResponse = () => {};

    constructor(request: Promise<Response>) {
        this.request = request;
        this.request.then(response => {
            if (response.ok) {
                this.setConnection("connected");
                this.setResponse("success");

                if (this.handleResponse) {
                    response.json()
                        .then(j => {
                            try {
                                this.handleResponse(j, response);
                            }
                            catch (ex) {
                                if (process.env.NODE_ENV !== "production") {
                                    console.error("Error handing response", response, ex);
                                }
                                throw ex;
                            }
                        }).catch(err => {
                            this.setConnection("errored");
                            this.setResponse("badRequest");
                            this.handleClientError(response);
                        });
                }
                else if (this.handleSuccess) {
                    this.handleSuccess(true, response);
                }
                else if (process.env.NODE_ENV !== "production") {
                    console.log("No handler to handle", this.request, response);
                }
            }
            else if (response.status >= 400 && response.status < 500) {
                this.setConnection("errored");
                this.setResponse("badRequest");
                this.handleClientError(response);
            }
            else if (response.status >= 500) {
                this.setConnection("errored");
                this.setResponse("serverError");
                this.handleServerError(response);
            }
            else if (process.env.NODE_ENV !== "PRODUCTION") {
                console.error(
                    "No handler present for ", this.request, response
                );
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

    onSuccess(handler: (bool) => void): BackendRequest<O> {
        if (this.handleResponse) {
            throw new Error([
                "Already have a handleSuccess registered",
                this.handleResponse
            ]);
        }
        this.handleSuccess = handler;
        return this;
    }

    onResponse(handler: (O) => void): BackendRequest<O> {
        if (this.handleSuccess) {
            throw new Error([
                "Already have a handleSuccess registered",
                this.handleSuccess
            ]);
        }
        this.handleResponse = handler;
        return this;
    }

    onClientError(handler: (Response) => void): BackendRequest<O> {
        this.handleClientError = handler;
        return this;
    }

    onServerError(handler: (Response) => void): BackendRequest<O> {
        this.handleServerError = handler;
        return this;
    }

    onNetworkError(handler: (any) => void): BackendRequest<O> {
        this.handleNetworkError = handler;
        return this;
    }

    onAnyError(handler: (Response) => void): BackendRequest<O> {
        this.handleClientError = handler;
        this.handleServerError = handler;
        this.handleNetworkError = handler;
        return this;
    }

    onDone(handler: (bool, any) => void): BackendRequest<O> {
        if (this.handleSuccess) {
            throw new Error([
                "Already have a handleSuccess registered",
                this.handleSuccess
            ]);
        }
        this.handleSuccess = handler;
        this.onAnyError(e => handler(false, e));
        return this;
    }

    onConnection(setter: SetConnection): BackendRequest<O> {
        this.setConnection = setter;
        setter("connecting");
        return this;
    }

    onResponseStatus(setter: SetResponse): BackendRequest<O> {
        this.setResponse = setter;
        return this;
    }
}

type FetchArgs<B, P> = {
    method: string,
    path: string,
    body?: B,
    params?: P
};
function backendFetch<B, P>({ method, path, body, params }: FetchArgs<B, P>): Promise<Response> {
    let url = server.BACKEND_URL + path;
    if (params) {
        // flow-ignore-all-next-line
        url = `${url}?${new URLSearchParams(params).toString()}`;
    }

    let headers = new Headers();
    headers.append("Content-Type", "text/json");
    if (auth.session) {
        headers.append("Authentication", `Bearer ${auth.session}`);
    }

    return fetch(url, {
        method,
        body: JSON.stringify(body),
        credentials: auth.session ? 'include' : 'omit',
        headers,
    });
}

export function get<I: { [string]: string }, O>(path: string, params: I): BackendRequest<O> {
    const fetchRequest = backendFetch({ method: "get", path, params });
    return new BackendRequest(fetchRequest);
 }

 export function post<I: $TypedArray, O>(path: string, body: I): BackendRequest<O> {
    const fetchRequest = backendFetch({ method: "post", path, body });
    return new BackendRequest(fetchRequest);
 }
