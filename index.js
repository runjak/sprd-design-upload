const { createReadStream } = require('fs');
const fetch = require('node-fetch');
const Readable = require('stream').Readable;

const { createAuthorizedFetch, withCookies, withDebug } = require('./authorized');

const {
  USERNAME: username,
  PASSWORD: password,
  API_KEY: apiKey,
  API_SECRET: apiSecret,
  USER_ID: userId,
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

async function fetchState(doFetch) {
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

/*
I'll need to implement TUS resumable file uploads:
https://tus.io/protocols/resumable-upload.html
*/
async function createIdea(doFetch, filename) {
  const url = `https://partner.spreadshirt.de/api/v1/image-uploader/users/${userId}/ideas`;

  const createResponse = await doFetch(
    url,
    {
      method: 'POST',
      headers: {
        'Upload-Metadata': `filename ${toBase64(filename)}`,
        'Upload-Length': '159524',
        'tus-resumable': '1.0.0',
      },
    },
  );

  return createResponse;
}

async function patchIdea(doFetch, createResponse, file) {

}

(async () => {
  const {id: sessionId, user: {id: userId}} = await createSession(fetch);
  console.log('created Session', {sessionId, userId});

  const authorizedFetch = createAuthorizedFetch(withCookies(withDebug(fetch)), sessionId, apiKey, apiSecret);

  const state = await fetchState(authorizedFetch);
  console.log('state', state);

  const creation = await createIdea(authorizedFetch, 'example.png');
  console.log('creation', creation, creation.headers.raw());
})();
