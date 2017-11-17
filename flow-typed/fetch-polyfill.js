// @flow

declare module 'isomorphic-fetch' {
    declare export default function fetch(input: string | Request,
                                          init?: RequestOptions): Promise<Response>;

  // The below types are globals defined by Flow itself in bom.js, so we just have to tell it that the fetch export
  // of this module is equivalent to window.fetch
  declare type PonyfillExports = {
    fetch: (input: string | Request, init?: RequestOptions) => Promise<Response>,
    Request: Request,
    Response: Response,
    Headers: Headers
  };
}
