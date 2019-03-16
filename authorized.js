const crypto = require('crypto');

const sessionUtils = require('./session-utils');

const fetch = require('node-fetch');

function createAuthorizedFetch(session, apiKey, apiSecret) {
  return (url, options) => {
    const sessionId = sessionUtils.sessionId(session);

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

module.exports = {
  createAuthorizedFetch,
};