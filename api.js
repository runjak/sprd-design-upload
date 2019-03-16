const fetch = require('node-fetch');

const sessionUtils = require('./session-utils');

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

async function createUserDesign(design, session) {
  const userId = sessionUtils.userId(session);
  const sessionId = sessionUtils.sessionId(session);
  const url = `${apiBaseUrl}/users/${userId}/designs?mediaType=json&sessionId=${sessionId}`;

  // FIXME needs apiKey
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(design),
  });

  return response.json();
}

async function deleteUserDesign(design, session) {
  const userId = sessionUtils.userId(session);
  const designId = designUtils.designId(design);

  // FIXME needs apiKey
  const url = `${apiBaseUrl}/users/${userId}/designs/${designId}`;

  await fetch(url, {method: 'DELETE'});
}

module.exports = {
  createSecuritySession,
  deleteSecuritySession,
  createUserDesign,
  deleteUserDesign,
};