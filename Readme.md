Sprd-Design-Upload
===

Prompted by a [Tweet](https://twitter.com/Bleeptrack/status/1106826121461616640) it made sense to explore the Spreadshirt API a little bit more.

In particular it's a pitty that there was no simple way to upload a design with a commission and be able to redirect people to a product with such a design.

This project aims to provide the means to:

* Upload a design to a spreadshirt shop
* Place metadata and a commission on the design
* Publish the design in a users shop
* Provide an URL where a user can buy the design on a product like a t-shirt or a mug.

This project is intended for use with node, and relies on the [fs](https://nodejs.org/api/fs.html) API to read and stat files.

Example usage
---

Example usage is documented in [src/example.ts](https://github.com/runjak/sprd-design-upload/blob/master/src/example.ts),
which can be executed using `npm start`.
It uses environment variables that can be read from `.env` which should be structured like the provided `.env.example`.

* `username` and `password` can be obtained by registering an account in the [partner area](https://partner.spreadshirt.de).
* `apiKey` and `apiSecret` can be obtained trough the [Spreadshirt developer documentation](https://developer.spreadshirt.net/display/API).

`example.ts` mainly performs two steps:

1. It calls `sessionFetch` to create a fetch function that works similarly to [node-fetch](https://www.npmjs.com/package/node-fetch) but also handles authentication as required by the API.
2. It calls `publishAndLink` with a fetch function and the data necessary to upload and publish a design.

Project history
---

* Initially we tried the outdated but public [SpreadShirt API Documentation](https://developer.spreadshirt.net/display/API).
  * With this we had no luck because:
    * Uploading with an image pointer is no longer supported for security reasons.
    * Setting a commission in a shop context doesn't work any more.
* Next we tried the current SpreadShirt T-Shirt Designer: [Sketchomat](https://designer.spreadshirt.de/designers/sketchomat?locale=de_DE).
* We also had a look at the source of [zufallsshirt.de](http://zufallsshirt.de) as included in the site.
  * Alas a short look didn't offer a solution.
* Therefore we looked at the [partner area](https://partner.spreadshirt.de) which does solve this problem, and REd the necessary API calls.
