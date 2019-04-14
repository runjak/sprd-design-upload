const crypto = require('crypto');
const fetchCookie = require('fetch-cookie');

function createAuthorizedFetch(fetch, sessionId, apiKey, apiSecret) {
  return (url, options) => {
    const data = `${options.method} ${url} ${Date.now()}`;
    const hash = crypto.createHash('sha1');
    hash.update(`${data} ${apiSecret}`);
    const signature = hash.digest('hex');

    const Authorization = `SprdAuth apiKey="${apiKey}", data="${data}", sig="${signature}", sessionId="${sessionId}"`;

    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization,
      },
    });
  };
}

function withCookies(fetch) {
  return fetchCookie(fetch);
}

function withDebug(fetch) {
  return (url, options) => {
    console.log('withDebug', url, JSON.stringify(options, undefined, 2));

    return fetch(url, options);
  };
}

module.exports = {
  createAuthorizedFetch,
  withCookies,
  withDebug,
};