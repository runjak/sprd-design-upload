import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import compareDest from 'date-fns/compare_desc';

import {FetchFunction, createAuthorizedFetch, withCookies, withDebug} from './fetch';

interface Currency {
  id: string,
  isoCode: string,
};

interface CurrenciesData {
  currencies: Array<Currency>,
};

interface Commission {
  amount: number,
  currencyId: string,
};

type PointOfSaleType = 'SHOP' | 'CYO' | 'MARKETPLACE';

interface PointOfSale {
  id: string,
  name?: string,
  type: PointOfSaleType,
  target: {
    id: string,
    currencyId?: string,
  }
};

interface PointsOfSale {
  list: Array<PointOfSale>,
};

interface Idea {
  id: string,
  href: string,
  dateCreated: string,
  dateModified: string | number,
  commission?: Commission,
};

interface Ideas {
  list: Array<Idea>,
};

const partnerUrl = 'https://partner.spreadshirt.de'
const apiBaseUrl = `${partnerUrl}/api/v1`;

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

async function putIdea(doFetch: FetchFunction, idea: Idea) {
  // const url = `${idea.href}?mediaType=json&updatePublishing=true`;
  const url = `${idea.href}?mediaType=json`;

  console.log('putIdea', url);

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

(async () => {
  const {id: sessionId, user: {id: userId}} = await createSession(fetch);
  const filePath = './example.png';

  const authorizedFetch = createAuthorizedFetch(withCookies(fetch), sessionId, apiKey, apiSecret);

  // Need to fetch state to obtain session cookie
  const state = await fetchState(authorizedFetch, userId);

  // const creation = await createIdea(authorizedFetch, userId, filePath);
  // console.log('creation', creation);
  // console.log('creation.headers', creation.headers.raw());
  // console.log('creation.text', await creation.text())

  // const patch = await patchIdea(authorizedFetch, creation, filePath);
  // console.log('patch', patch);
  // console.log('patch.headers', patch.headers.raw());
  // console.log('patch.text', await patch.text());

  // const ideas = await fetchIdeas(authorizedFetch, userId);
  // const newest = newestIdea(ideas);
  // console.log('newest', JSON.stringify(newest, undefined, 2));

  // if (!newest) {
  //   console.log('No newest idea found!');
  //   return;
  // }

  const pos = await fetchPointsOfSale(authorizedFetch, userId);
  console.log('pos', JSON.stringify(pos, undefined, 2));

  // const withCommission = setCommission(newest, 1.23);
  // const putResponse = await putIdea(authorizedFetch, withCommission);

  // console.log('putResponse', putResponse);
})();
