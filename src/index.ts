import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import compareDest from 'date-fns/compare_desc';
import uniqBy from 'lodash/uniqBy';

import {FetchFunction, createAuthorizedFetch, withCookies, withDebug} from './fetch';
import {CurrenciesData, Idea, Ideas, PointOfSale, PointsOfSale, Assortment, IdeaTranslation, PointOfSaleType} from './types';

const partnerUrl = 'https://partner.spreadshirt.de'
const apiBaseUrl = `${partnerUrl}/api/v1`;
const shopUrl = 'https://shop.spreadshirt.de';

const {
  USERNAME: username,
  PASSWORD: password,
  API_KEY: apiKey = '',
  API_SECRET: apiSecret = '',
} = process.env;

async function createSession(doFetch: FetchFunction) {
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

async function fetchState(doFetch: FetchFunction, userId: string) {
  const url = `${partnerUrl}/address-check/partners/${userId}/state`;

  const response = await doFetch(url, { method: 'GET' });

  return response.json();
}

async function fetchCurrencies(doFetch: FetchFunction) {
  const url = `${apiBaseUrl}/currencies?mediaType=json&fullData=true`;

  const currenciesResponse = await doFetch(url, {method: 'GET'});

  return currenciesResponse.json();
}

function findIdForIsoCodeInCurrenciesData(currenciesData: CurrenciesData, wantedIsoCode: string = 'EUR'): string | null {
  const { currencies } = currenciesData;

  const [currency] = currencies.filter(({isoCode}) => isoCode === wantedIsoCode);

  return currency ? currency.id : null;
}

async function fetchIdeas(doFetch: FetchFunction, userId: string) {
  const url = `${apiBaseUrl}/users/${userId}/ideas?fullData=true&mediaType=json&currencyId=1&locale=de_DE&offset=0&limit=47`;

  const ideasResponse = await doFetch(url, {method: 'GET'});

  return ideasResponse.json();
}

function newestIdea(ideas: Ideas): Idea | null {
  return ideas.list.reduce(
    (last: Idea | null, next: Idea) => {
      if (last === null) {
        return next;
      }

      const cmp = compareDest(
        new Date(last.dateCreated),
        new Date(next.dateCreated),
      );

      return (cmp < 0) ? last : next;
    },
    null,
  );
}

function toBase64(input: string) {
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

async function createIdea(doFetch: FetchFunction, userId: string, filePath: string) {
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

async function patchIdea(doFetch: FetchFunction, createResponse: Response, filePath: string) {
  //  @ts-ignore: headers.raw() exists
  const { location: url } = createResponse.headers.raw();
  const body = fs.createReadStream(filePath);

  const patchResponse = await doFetch(
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

function setCommission(idea: Idea, amount: number): Idea {
  return {
    ...idea,
    commission: {
      amount,
      currencyId: '1',
    },
  };
}

async function putIdea(doFetch: FetchFunction, idea: Idea, updatePublishing: boolean = false) {
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

async function fetchPointsOfSale(doFetch: FetchFunction, userId: string): Promise<PointsOfSale> {
  const url = `${apiBaseUrl}/users/${userId}/pointsOfSale?mediaType=json`;

  const response = await doFetch(url, {method: 'GET'});

  return response.json();
}

function setPublishingDetails(idea: Idea, pointsOfSale: Array<PointOfSale>): Idea {
  return {
    ...idea,
    publishingDetails: pointsOfSale.map((pointOfSale) => ({
      pointOfSale: {
        ...pointOfSale,
        allowed: true,
      }
    })),
  };
}

function filterPointsOfSaleByType(pointsOfSale: PointsOfSale, filterType: PointOfSaleType): Array<PointOfSale> {
  return pointsOfSale.list.filter(({type}) => (type === filterType));
}

async function fetchAssortment(doFetch: FetchFunction, idea: Idea): Promise<Assortment> {
  const url = `${idea.href}/assortment?mediaType=json`;

  const response = await doFetch(url, {method: 'GET'});

  return response.json();
}

function setAssortment(idea: Idea, assortment: Assortment): Idea {
  return {
    ...idea,
    assortment,
  };
}

function setTranslation(idea: Idea, translation: IdeaTranslation): Idea {
  return {
    ...idea,
    translations: uniqBy(
      [translation, ...idea.translations],
      ({locale}) => (locale),
    ),
  };
}

function designUrlForIdea(idea: Idea, productTypeId: string = '812'): string {
  const pointsOfSale = (idea.publishingDetails || []).map(p => p.pointOfSale);
  const [shopName = ''] = pointsOfSale.filter(({type}) => (type === 'SHOP')).map(p => p.name);

  return `${shopUrl}/${shopName}/create?design=${idea.mainDesignId}&productType=${productTypeId}`;
}

(async () => {
  const session = await createSession(fetch);
  const {id: sessionId, user: {id: userId}} = session;
  const filePath = './example.png';

  const authorizedFetch = createAuthorizedFetch(withCookies(fetch), sessionId, apiKey, apiSecret);

  // Need to fetch state to obtain session cookie
  const state = await fetchState(authorizedFetch, userId);

  console.log('session', JSON.stringify(session, undefined, 2));

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
