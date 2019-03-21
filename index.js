const { createReadStream } = require('fs');

const api = require('./api');
const sessionUtils = require('./session-utils');

const {
  USERNAME: username,
  PASSWORD: password,
  API_KEY: apiKey,
  API_SECRET: apiSecret,
  SHOP_ID: shopId,
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
    const uploadResponse = await authorized.uploadShopDesign(
      shopId,
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