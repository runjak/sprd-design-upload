const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const Readable = require('stream').Readable;

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

async function fetchIdeas(doFetch) {
  const url = `${apiBaseUrl}/users/${userId}/ideas?fullData=true&mediaType=json&currencyId=1&locale=de_DE&offset=0&limit=47`;

  const ideasResponse = await doFetch(url, {method: 'GET'});

  return ideasResponse.json();
}

function toBase64(input) {
  return Buffer.from(input).toString('base64');
}

function fromBase64(input) {
  return Buffer.from(input, 'base64').toString('utf8');
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

(async () => {
  const {id: sessionId, user: {id: userId}} = await createSession(fetch);
  const filePath = './example.png';
  console.log('created Session', {sessionId, userId});

  const authorizedFetch = createAuthorizedFetch(withCookies(withDebug(fetch)), sessionId, apiKey, apiSecret);

  const state = await fetchState(authorizedFetch, userId);
  console.log('state', state);

  const creation = await createIdea(authorizedFetch, userId, filePath);
  console.log('creation', creation, creation.headers.raw());

  const patch = await patchIdea(authorizedFetch, creation, filePath);
  console.log('patch', patch);
  console.log('patch.headers', patch.headers.raw());
  console.log('patch.text', await patch.text());
})();
