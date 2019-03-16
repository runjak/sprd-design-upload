const fetch = require('node-fetch');

const sessionUtils = require('./session-utils');
const designUtils = require('./design-utils');
const authorized = require('./authorized');

const apiBaseUrl = 'https://api.spreadshirt.net/api/v1';

async function createSecuritySession(username, password) {
  const url = `${apiBaseUrl}/sessions?mediaType=json`;

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
    }),
  });

  return response.json();
}

async function deleteSecuritySession(session) {
  const sessionId = sessionUtils.sessionId(session);
  const url = `${apiBaseUrl}/sessions/${sessionId}`;

  await fetch(url, {method: 'DELETE'});
}

function createUserDesign(authorizedFetch, session) {
  return async () => {
    const userId = sessionUtils.userId(session);
    const url = `${apiBaseUrl}/users/${userId}/designs?mediaType=json`;

    const response = await authorizedFetch(url, {
      method: 'POST',
      body: JSON.stringify({}),
    });

    return response.json();
  };
}

function updateUserDesign(authorizedFetch, session) {
  return async (design) => {
    const userId = sessionUtils.userId(session);
    const designId = designUtils.designId(design);
    const url = `${apiBaseUrl}/users/${userId}/designs/${designId}?mediaType=json`;

    const response = await authorizedFetch(url, {
      method: 'PUT',
      body: JSON.stringify(design),
    });

    return response.json();
  };
}

function deleteUserDesign(authorizedFetch, session) {
  return async (design) => {
    const userId = sessionUtils.userId(session);
    const designId = designUtils.designId(design);

    const url = `${apiBaseUrl}/users/${userId}/designs/${designId}`;

    await authorizedFetch(url, {method: 'DELETE'});
  };
}

function authorize(session, apiKey, apiSecret) {
  const authorizedFetch = authorized.createAuthorizedFetch(session, apiKey, apiSecret);

  return {
    createUserDesign: createUserDesign(authorizedFetch, session),
    updateUserDesign: updateUserDesign(authorizedFetch, session),
    deleteUserDesign: deleteUserDesign(authorizedFetch, session),
  };
}

module.exports = {
  createSecuritySession,
  deleteSecuritySession,
  authorize,
};