const api = require('./api');
const sessionUtils = require('./session-utils');
const designUtils = require('./design-utils');

const {
  USERNAME: username,
  PASSWORD: password,
  API_KEY: apiKey,
  API_SECRET: apiSecret,
} = process.env;

const exampleDesign = {
  name: '@sicarius',
  description: 'Avatar of @sicarius',
  // sourceUrl: 'https://avatars0.githubusercontent.com/u/5417642?s=460&v=4',
  sourceUrl: 'https://image.spreadshirtmedia.net/image-server/v1/configurations/16940335.jpg',
  price: 1,
};

(async () => {
  const session = await api.createSecuritySession(username, password);
  console.log('Logged in as', sessionUtils.userId(session));
  const authorized = api.authorize(session, apiKey, apiSecret);

  try {
    const createResponse = await authorized.createUserDesign();
    console.log('Created design', createResponse);

    const uploadDesignResponse = await authorized.uploadDesignImage(
      createResponse,
      exampleDesign.sourceUrl,
    );
    console.log('DRAGONS', uploadDesignResponse);

    await authorized.deleteUserDesign(createResponse);
    console.log('Deleted design.');
  } catch (error) {
    console.log('Error creating design', error);
  } finally {
    console.log('Logging out…');

    await api.deleteSecuritySession(session);
  }
})();