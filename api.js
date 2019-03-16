const fetch = require('node-fetch');

const sessionUtils = require('./session-utils');

const apiBaseUrl = 'https://api.spreadshirt.net/api/v1';

async function createSecuritySession(username, password) {
  const url = `${apiBaseUrl}/sessions?mediaType=json`;

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({username, password}),
  });

  return response.json();
}

async function deleteSecuritySession(session) {
  const sessionId = sessionUtils.sessionId(session);
  const url = `${apiBaseUrl}/sessions/${sessionId}`;

  await fetch(url, {method: 'DELETE', body: '{}'});
}

module.exports = {
  createSecuritySession,
  deleteSecuritySession,
};