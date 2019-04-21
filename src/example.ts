import { sessionFetch, publishAndLink } from './index';

const {
  USERNAME: username = '',
  PASSWORD: password = '',
  API_KEY: apiKey = '',
  API_SECRET: apiSecret = '',
} = process.env;

const filePath = './example.png';

(async () => {
  const { doFetch, userId } = await sessionFetch({
    username,
    password,
    apiKey,
    apiSecret,
  });

  const link = await publishAndLink(doFetch, {
    filePath,
    userId,
    commission: 1,
    translation: {
      name: 'magical-example',
      tags: [],
      locale: 'de_DE',
      autotranslated: false,
      description: 'magical example',
    },
  });

  console.log('Use design here:', link);
})();