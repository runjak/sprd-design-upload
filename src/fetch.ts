import crypto from 'crypto';
import fetchCookie from 'fetch-cookie';
import { Response, RequestInit } from 'node-fetch';

export type FetchFunction = (url: string, options: RequestInit) => Promise<Response>;

export function createAuthorizedFetch(doFetch: FetchFunction, sessionId: string, apiKey: string, apiSecret: string): FetchFunction {
  return (url: string, options: RequestInit): Promise<Response> => {
    const data = `${options.method} ${url} ${Date.now()}`;
    const hash = crypto.createHash('sha1');
    hash.update(`${data} ${apiSecret}`);
    const signature = hash.digest('hex');

    const Authorization = `SprdAuth apiKey="${apiKey}", data="${data}", sig="${signature}", sessionId="${sessionId}"`;

    return doFetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization,
      },
    });
  };
}

export function withCookies(doFetch: FetchFunction): FetchFunction {
  return fetchCookie(doFetch);
}

export function withDebug(doFetch: FetchFunction): FetchFunction {
  return (url, options) => {
    console.log('withDebug', url, JSON.stringify(options, undefined, 2));

    return doFetch(url, options);
  };
}
