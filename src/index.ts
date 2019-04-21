import fs from 'fs';
import path from 'path';
import fetch, { Response } from 'node-fetch';
import { Readable } from 'stream';

import {
  FetchFunction,
  createAuthorizedFetch,
  withCookies,
} from './fetch';

import {
  CurrenciesData,
  Idea,
  Ideas,
  PointsOfSale,
  Assortment,
  Session,
} from './types';

import { apiBaseUrl, partnerUrl } from './consts';

import {newestIdea, designUrlForIdea} from './data';

const {
  USERNAME = '',
  PASSWORD = '',
  API_KEY = '',
  API_SECRET = '',
} = process.env;

export async function createSession(doFetch: FetchFunction, username: string, password: string): Promise<Session> {
  const url = `${apiBaseUrl}/sessions?mediaType=json`;
  const loginData = {
    rememberMe: false,
    username,
    password,
  };

  const body = new Readable;
  body.push(JSON.stringify(loginData));
  body.push(null);

  const createResponse = await doFetch(url, { method: 'POST', body });

  return createResponse.json();
}

export async function fetchState(doFetch: FetchFunction, userId: string): Promise<Object> {
  const url = `${partnerUrl}/address-check/partners/${userId}/state`;

  const response = await doFetch(url, { method: 'GET' });

  return response.json();
}

export async function fetchCurrencies(doFetch: FetchFunction): Promise<CurrenciesData> {
  const url = `${apiBaseUrl}/currencies?mediaType=json&fullData=true`;

  const currenciesResponse = await doFetch(url, {method: 'GET'});

  return currenciesResponse.json();
}

export async function fetchIdeas(doFetch: FetchFunction, userId: string): Promise<Ideas> {
  const url = `${apiBaseUrl}/users/${userId}/ideas?fullData=true&mediaType=json&currencyId=1&locale=de_DE&offset=0&limit=47`;

  const ideasResponse = await doFetch(url, {method: 'GET'});

  return ideasResponse.json();
}

function toBase64(input: string): string {
  return Buffer.from(input).toString('base64');
}

function asyncStat(filePath: string): Promise<fs.Stats> {
  return new Promise((fulfill, reject) => {
    fs.stat(filePath, (error, stats) => {
      if (error !== null) {
        reject(error);
      } else {
        fulfill(stats);
      }
    });
  });
}

export async function createIdea(doFetch: FetchFunction, userId: string, filePath: string): Promise<Response> {
  const url = `${apiBaseUrl}/image-uploader/users/${userId}/ideas`;
  const { size } = await asyncStat(filePath);

  const createResponse = await doFetch(
    url,
    {
      method: 'POST',
      // @ts-ignore: headers are as desired
      headers: {
        'tus-resumable': '1.0.0',
        'Upload-Metadata': `filename ${toBase64(path.basename(filePath))}`,
        'Upload-Length': size,
      },
    },
  );

  return createResponse;
}

export async function patchIdea(doFetch: FetchFunction, createResponse: Response, filePath: string): Promise<Response> {
  const { location: url } = createResponse.headers.raw();
  const body = fs.createReadStream(filePath);

  const patchResponse = await doFetch(
    // @ts-ignore url is string not string[].
    url,
    {
      method: 'PATCH',
      headers: {
        'content-type': 'application/offset+octet-stream',
        'tus-resumable': '1.0.0',
        'upload-offset': '0',
      },
      body,
    },
  );

  return patchResponse;
}

export async function putIdea(doFetch: FetchFunction, idea: Idea, updatePublishing: boolean = false) {
  const url = `${idea.href}?mediaType=json${updatePublishing ? '&updatePublishing=true' : ''}`;

  const response = await doFetch(url, {
    method: 'PUT',
    body: JSON.stringify({
      ...idea,
      dateModified: Date.now(),
    }),
  });

  return response.json();
}

export async function fetchPointsOfSale(doFetch: FetchFunction, userId: string): Promise<PointsOfSale> {
  const url = `${apiBaseUrl}/users/${userId}/pointsOfSale?mediaType=json`;

  const response = await doFetch(url, {method: 'GET'});

  return response.json();
}

export async function fetchAssortment(doFetch: FetchFunction, idea: Idea): Promise<Assortment> {
  const url = `${idea.href}/assortment?mediaType=json`;

  const response = await doFetch(url, {method: 'GET'});

  return response.json();
}

(async () => {
  const {id: sessionId, user: {id: userId}} = await createSession(fetch, USERNAME, PASSWORD);
  const filePath = './example.png';

  const authorizedFetch = createAuthorizedFetch(withCookies(fetch), sessionId, API_KEY, API_SECRET);

  // Need to fetch state to obtain session cookie
  const state = await fetchState(authorizedFetch, userId);

  const ideas = await fetchIdeas(authorizedFetch, userId);
  const newest = newestIdea(ideas);

  if (!newest) {
    console.log('No newest idea found!');
    return;
  }

  console.log('newest', JSON.stringify(newest, undefined, 2));
  console.log(designUrlForIdea(newest));

  // const assortment = await fetchAssortment(authorizedFetch, newest);
  // const pos = await fetchPointsOfSale(authorizedFetch, userId);
  // const filteredPos = filterPointsOfSaleByType(pos, 'SHOP');

  // const tryToPublish = setPublishingDetails(
  //   setAssortment(newest, assortment),
  //   filteredPos,
  // );
  // console.log('tryToPublish', JSON.stringify(tryToPublish, undefined, 2));

  // const publishResponse = await putIdea(authorizedFetch, tryToPublish);
  // console.log('publishResponse', JSON.stringify(publishResponse, undefined, 2));
})();
