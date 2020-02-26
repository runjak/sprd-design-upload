declare module "fetch-cookie" {
  import fetch, { Request, Response, RequestInit } from 'node-fetch';
  
  type FetchFunction = (url: string, options: RequestInit) => Promise<Response>;
  
  function fetchCookie(
    doFetch: FetchFunction,
  ): FetchFunction;

  export default fetchCookie;
}
