import fetch from "cross-fetch";
import crypto from "crypto";
import fetchCookie from "fetch-cookie";

export type FetchFunction = typeof fetch;

export function createAuthorizedFetch(
  doFetch: FetchFunction,
  sessionId: string,
  apiKey: string,
  apiSecret: string
): FetchFunction {
  return (url, options) => {
    const data = `${options?.method ?? "GET"} ${url} ${Date.now()}`;
    const hash = crypto.createHash("sha1");
    hash.update(`${data} ${apiSecret}`);
    const signature = hash.digest("hex");

    const Authorization = `SprdAuth apiKey="${apiKey}", data="${data}", sig="${signature}", sessionId="${sessionId}"`;

    return doFetch(url, {
      ...options,
      headers: {
        ...(options?.headers ?? {}),
        Authorization,
      },
    });
  };
}

export function withCookies(doFetch: FetchFunction): FetchFunction {
  // @ts-ignore I just stopped caring
  return fetchCookie(doFetch);
}

export function withDebug(doFetch: FetchFunction): FetchFunction {
  return (url, options) => {
    console.log("withDebug", url, JSON.stringify(options, undefined, 2));

    return doFetch(url, options);
  };
}
