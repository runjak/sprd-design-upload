const api = require('./api');
const sessionUtils = require('./session-utils');
const designUtils = require('./design-utils');

const {
  USERNAME: username,
  PASSWORD: password,
} = process.env;

const design = designUtils.newDesign(
  '@sicarius',
  'Avatar of @sicarius',
  'https://avatars0.githubusercontent.com/u/5417642?s=460&v=4',
  1,
);

(async () => {
  const session = await api.createSecuritySession(username, password);
  console.log('Logged in as', sessionUtils.userId(session));

  try {
    const createResponse = await api.createUserDesign(design, session);

    console.log('Created design', createResponse);
  } catch (error) {
    console.log('Error creating design', error);
  } finally {
    console.log('Logging out…');

    await api.deleteSecuritySession(session);
  }
})();