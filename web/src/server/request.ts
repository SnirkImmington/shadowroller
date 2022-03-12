import * as server from 'server';
import * as auth from './auth';
import type { Json, Setter } from 'srutil';
import type { SetConnection, SetRetryConnection, SetResponse } from 'connection';

export class BackendRequest<O extends Json | void> {
    request: Promise<Response>;
    handleSuccess: ((success: boolean, response: Response) => void) | undefined;
    handleResponse: ((value: O, response: Response) => void) | undefined;
    handleClientError: (response: Response) => void = () => {};
    handleServerError: (response: Response) => void = () => {};
    handleNetworkError: (error: any) => void = () => {};
    setConnection: SetConnection | SetRetryConnection = () => {};
    setLoading: Setter<boolean> = () => {};
    setResponse: SetResponse = () => {};

    constructor(request: Promise<Response>) {
        this.request = request;
        this.request.then(response => {
            this.setLoading(false);
            if (response.ok) {
                this.setConnection("connected");
                this.setResponse("success");

                if (this.handleResponse) {
                    response.json()
                        .then(j => {
                            try {
                                // We will throw if handleResponse isn't defined.
                                // This would only happen if handleResponse is removed between the check and response.json().then()
                                this.handleResponse!(j, response);
                            }
                            catch (ex) {
                                if (process.env.NODE_ENV !== "production") {
                                    console.error("Error handing response", response, ex);
                                }
                                throw ex;
                            }
                        }).catch(_err => {
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
            else if (process.env.NODE_ENV !== "production") {
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

    onSuccess(handler: (success: boolean) => void): BackendRequest<O> {
        if (this.handleResponse) {
            throw new Error(
                "onSuccess: already have a handleResponse registered",
            );
        }
        this.handleSuccess = handler;
        return this;
    }

    onResponse(handler: (output: O) => void): BackendRequest<O> {
        if (this.handleSuccess) {
            throw new Error(
                "onResponse: already have a handleSuccess registered",
            );
        }
        this.handleResponse = handler;
        return this;
    }

    onClientError(handler: (response: Response) => void): BackendRequest<O> {
        this.handleClientError = handler;
        return this;
    }

    onServerError(handler: (response: Response) => void): BackendRequest<O> {
        this.handleServerError = handler;
        return this;
    }

    onNetworkError(handler: (error: any) => void): BackendRequest<O> {
        this.handleNetworkError = handler;
        return this;
    }

    onAnyError(handler: (response: Response) => void): BackendRequest<O> {
        this.handleClientError = handler;
        this.handleServerError = handler;
        this.handleNetworkError = handler;
        return this;
    }

    onDone(handler: (success: boolean, errorOrResponse: any) => void): BackendRequest<O> {
        if (this.handleSuccess) {
            throw new Error(
                "Already have a handleSuccess registered",
            );
        }
        this.handleSuccess = handler;
        this.onAnyError(e => handler(false, e));
        return this;
    }

    onConnection(setter: SetConnection | SetRetryConnection): BackendRequest<O> {
        this.setConnection = setter;
        setter("connecting");
        return this;
    }

    onLoading(setter?: Setter<boolean>): BackendRequest<O> {
        if (setter) {
            this.setLoading = setter;
            setter(true);
        }
        return this;
    }

    onResponseStatus(setter: SetResponse): BackendRequest<O> {
        this.setResponse = setter;
        return this;
    }
}

type ParamsCtor = string | string[][] | Record<string, string|number|undefined> | URLSearchParams | undefined;

type FetchArgs<B extends Json, P extends ParamsCtor> = {
    method: string,
    path: string,
    body?: B,
    params?: P
};
function backendFetch<B extends Json, P extends ParamsCtor>({ method, path, body, params }: FetchArgs<B, P>): Promise<Response> {
    let url = server.BACKEND_URL + path;
    if (params) {
        // @ts-ignore Diff between ParamsCtor and URLSearchParams is ParamsCtor accepts undefined, which is needed for optional values and is fine to send and parse
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

export function get<I extends ParamsCtor, O extends Json>(path: string, params: I): BackendRequest<O> {
    const fetchRequest = backendFetch({ method: "get", path, params });
    return new BackendRequest(fetchRequest);
 }

 export function post<B extends Json, O extends Json | void>(path: string, body: B): BackendRequest<O> {
    const fetchRequest = backendFetch({ method: "post", path, body });
    return new BackendRequest(fetchRequest);
 }
