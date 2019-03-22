const { createReadStream } = require('fs');

const api = require('./api');
const sessionUtils = require('./session-utils');

const {
  USERNAME: username,
  PASSWORD: password,
  API_KEY: apiKey,
  API_SECRET: apiSecret,
} = process.env;

(async () => {
  const session = await api.createSecuritySession(username, password);
  console.log('Logged in as', sessionUtils.userId(session));
  const authorized = api.authorize(session, apiKey, apiSecret);

  try {
    const uploadResponse = await authorized.uploadUserDesign(
      createReadStream('./example.png')
    );

    console.log('Uploaded design', uploadResponse);
  } catch (error) {
    console.log('Error creating design', error);
  } finally {
    console.log('Logging out…');

    await api.deleteSecuritySession(session);
  }
})();