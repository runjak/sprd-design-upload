const { createReadStream } = require('fs');
const fetch = require('node-fetch');
const Readable = require('stream').Readable;

const { createAuthorizedFetch, withCookies, withDebug } = require('./authorized');

const {
  USERNAME: username,
  PASSWORD: password,
  API_KEY: apiKey,
  API_SECRET: apiSecret,
} = process.env;

async function createSession(doFetch) {
  const url = `https://partner.spreadshirt.de/api/v1/sessions?mediaType=json`;
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
  const url = `https://partner.spreadshirt.de/address-check/partners/${userId}/state`;

  const response = await doFetch(url, { method: 'GET' });

  return response.json();
}

async function fetchCurrencies(doFetch) {
  const currenciesUrl = 'https://partner.spreadshirt.de/api/v1/currencies?mediaType=json&fullData=true';
  const currenciesResponse = await doFetch(currenciesUrl, {method: 'GET'});

  return currenciesResponse.json();
}

function findIdForIsoCodeInCurrenciesData(currenciesData, wantedIsoCode = 'EUR') {
  const { currencies } = currenciesData;

  const [currency] = currencies.filter(({isoCode}) => isoCode === wantedIsoCode);

  return currency ? currency.id : null;
}

async function fetchIdeas(doFetch) {
  const ideasUrl = `https://partner.spreadshirt.de/api/v1/users/${userId}/ideas?fullData=true&mediaType=json&currencyId=1&locale=de_DE&offset=0&limit=47`;

  const ideasResponse = await doFetch(ideasUrl, {method: 'GET'});

  return ideasResponse.json();
}

function toBase64(input) {
  return Buffer.from(input).toString('base64');
}

function fromBase64(input) {
  return Buffer.from(input, 'base64').toString('utf8');
}

async function createIdea(doFetch, userId, filename) {
  const url = `https://partner.spreadshirt.de/api/v1/image-uploader/users/${userId}/ideas`;

  // FIXME automate filename and upload-length
  const createResponse = await doFetch(
    url,
    {
      method: 'POST',
      headers: {
        'tus-resumable': '1.0.0',
        'Upload-Metadata': `filename ${toBase64(filename)}`,
        'Upload-Length': '159524',
      },
    },
  );

  return createResponse;
}

// FIXME use some kind of file object for post and patch
async function patchIdea(doFetch, createResponse, file) {
  const { location: url } = createResponse.headers.raw();
  const body = createReadStream(file);

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
  console.log('created Session', {sessionId, userId});

  const authorizedFetch = createAuthorizedFetch(withCookies(withDebug(fetch)), sessionId, apiKey, apiSecret);

  const state = await fetchState(authorizedFetch, userId);
  console.log('state', state);

  const creation = await createIdea(authorizedFetch, userId, 'example.png');
  console.log('creation', creation, creation.headers.raw());

  const patch = await patchIdea(authorizedFetch, creation, './example.png');
  console.log('patch', patch);
  console.log('patch.headers', patch.headers.raw());
  console.log('patch.text', await patch.text());
})();
