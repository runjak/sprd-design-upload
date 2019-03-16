Sprd-Design-Upload
===

Prompted by a [Tweet](https://twitter.com/Bleeptrack/status/1106826121461616640) it made sense to explore the Spreadshirt API a little bit more.

In particular it's a pitty that there is no simple way to upload a design with a commission and be able to redirect people to a product with such a design.

Current progress:
---

* There is code that can login and logout given username and password as environment variables.
  * You can put a `.env` file to read these from and use `yarn start`/`npm start` to execute with `dotenv`.
* Creation of user designs requires an ApiKey and Secret.
  * These should be given as environment variables, too.
  * The current SpreadShirt Documentation doesn't give enough hints on how to obtain these credentials.
  * Once the credentials are known we can presumably build a simple wrapper for `node-fetch` to add signatures and get design uploads working
  * Once design uploads work we can redirect users to a Sketchomat with a desired designId.
* To open a design in the Sketchomat you can apparently use a GET parameter like `designId=10441723`.

Useful URLs
---

* The current SpreadShirt T-Shirt Designer: [Sketchomat](https://designer.spreadshirt.de/designers/sketchomat?locale=de_DE).
* The SpreadShirt [API Documentation](https://developer.spreadshirt.net/display/API).