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
  AuthData,
  IdeaTranslation,
} from './types';

import { apiBaseUrl, partnerUrl } from './consts';

import {newestIdea, designUrlForIdea, setCommission, filterPointsOfSaleByType, setPublishingDetails, setTranslation, setAssortment} from './data';

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

export async function putIdea(doFetch: FetchFunction, idea: Idea, updatePublishing: boolean) {
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

export async function sessionFetch({username, password, apiKey, apiSecret}: AuthData): Promise<{doFetch: FetchFunction, userId: string}> {
  const {id: sessionId, user: {id: userId}} = await createSession(fetch, username, password);
  const doFetch = createAuthorizedFetch(withCookies(fetch), sessionId, apiKey, apiSecret);

  // Need to fetch state to obtain session cookie
  await fetchState(doFetch, userId);

  return { doFetch, userId };
}

interface PublishData {
  filePath: string,
  userId: string,
  commission: number,
  translation: IdeaTranslation,
};

export async function publishAndLink(doFetch: FetchFunction, publishData: PublishData): Promise<string> {
  const { filePath, userId, commission, translation } = publishData;

  const createResponse = await createIdea(doFetch, userId, filePath);
  await patchIdea(doFetch, createResponse, filePath);

  const latestIdeas = await fetchIdeas(doFetch, userId);
  const newest = newestIdea(latestIdeas);

  if (!newest) {
    throw new Error('No newest idea found.');
  }

  const updatedIdea = await putIdea(
    doFetch,
    setCommission(
      setTranslation(
        newest,
        translation,
      ),
      commission,
    ),
    false,
  );

  // FIXME we need to wait here, until the idea can be updated :(
  console.log({updatedIdea});

  const pointsOfSale = await fetchPointsOfSale(doFetch, userId);
  const assortment = await fetchAssortment(doFetch, newest);

  const toPublish = setPublishingDetails(
    setAssortment(
      updatedIdea,
      assortment,
    ),
    filterPointsOfSaleByType(pointsOfSale, 'SHOP'),
  );

  const publishedIdea = await putIdea(doFetch, toPublish, true);

  return designUrlForIdea(publishedIdea);
}
