const api = require('./api');
const sessionUtils = require('./session');

const {
  USERNAME: username,
  PASSWORD: password,
} = process.env;

console.log('Starting!', username);

api.createSecuritySession(username, password).then((session) => {
  console.log('Result:', JSON.stringify(sessionUtils.userId(session)));

  console.log('Logging out…');

  api.deleteSecuritySession(session);
}).catch((error) => {
  console.log('WAT!', error);
});