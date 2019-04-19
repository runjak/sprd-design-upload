const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Readable = require('stream').Readable;
const compareDest = require('date-fns/compare_desc');

const { createAuthorizedFetch, withCookies, withDebug } = require('./authorized');

const partnerUrl = 'https://partner.spreadshirt.de'
const apiBaseUrl = `${partnerUrl}/api/v1`;

const {
  USERNAME: username,
  PASSWORD: password,
  API_KEY: apiKey,
  API_SECRET: apiSecret,
} = process.env;

async function createSession(doFetch) {
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

async function fetchState(doFetch, userId) {
  const url = `${partnerUrl}/address-check/partners/${userId}/state`;

  const response = await doFetch(url, { method: 'GET' });

  return response.json();
}

async function fetchCurrencies(doFetch) {
  const url = `${apiBaseUrl}/currencies?mediaType=json&fullData=true`;

  const currenciesResponse = await doFetch(url, {method: 'GET'});

  return currenciesResponse.json();
}

function findIdForIsoCodeInCurrenciesData(currenciesData, wantedIsoCode = 'EUR') {
  const { currencies } = currenciesData;

  const [currency] = currencies.filter(({isoCode}) => isoCode === wantedIsoCode);

  return currency ? currency.id : null;
}

async function fetchIdeas(doFetch, userId) {
  const url = `${apiBaseUrl}/users/${userId}/ideas?fullData=true&mediaType=json&currencyId=1&locale=de_DE&offset=0&limit=47`;

  const ideasResponse = await doFetch(url, {method: 'GET'});

  return ideasResponse.json();
}

function newestIdea(ideas) {
  return ideas.list.reduce(
    (last, next) => {
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

function toBase64(input) {
  return Buffer.from(input).toString('base64');
}

function asyncStat(filePath) {
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

async function createIdea(doFetch, userId, filePath) {
  const url = `${apiBaseUrl}/image-uploader/users/${userId}/ideas`;
  const { size } = await asyncStat(filePath);

  const createResponse = await doFetch(
    url,
    {
      method: 'POST',
      headers: {
        'tus-resumable': '1.0.0',
        'Upload-Metadata': `filename ${toBase64(path.basename(filePath))}`,
        'Upload-Length': size,
      },
    },
  );

  return createResponse;
}

async function patchIdea(doFetch, createResponse, filePath) {
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

async function setCommission(doFetch, idea, amount, currency = 'EUR') {
  const { href, ...rest } = idea;
  const ideaWithCommission = {
    ...rest,
    commission: {
      amount,
      currencyId: '1',
    },
  };

  const response = await doFetch(href, {method: 'PUT'});

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

  const ideas = await fetchIdeas(authorizedFetch, userId);
  const newest = newestIdea(ideas);
  console.log('newest', JSON.stringify(newest, undefined, 2));

  const withCommision = await setCommission(authorizedFetch, newest, 5);
  console.log('withCommission', JSON.stringify(withCommision, undefined, 2));
})();
