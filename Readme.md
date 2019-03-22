Sprd-Design-Upload
===

Prompted by a [Tweet](https://twitter.com/Bleeptrack/status/1106826121461616640) it made sense to explore the Spreadshirt API a little bit more.

In particular it's a pitty that there is no simple way to upload a design with a commission and be able to redirect people to a product with such a design.

Current progress:
---

* There is code that can login and logout given username and password as environment variables.
  * You can put a `.env` file to read these from and use `yarn start`/`npm start` to execute with `dotenv`.
  * apiKey and apiSecret are now also given via environment variables.
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

Experiment
---

There is an internal util called `sprdcurl` that wraps apiKey handling and signing.
We used it to upload an image to a shop resource:

```bash
$ sprdcurl -F filedata=@/home/…/Pictures/Screenshot-1553085752.png 'https://api.vm296.vnet/api/v1/shops/205909/design-uploads'
curl -F filedata=@/home/…/Pictures/Screenshot-1553085752.png \
  --header 'Authorization: SprdAuth apiKey="…", data="POST https://api.vm296.vnet/api/v1/shops/205909/design-uploads 1553085993736", sig="…"' \
  --header 'User-Agent: sprd-curl-0.1.4-@…' https://api.vm296.vnet/api/v1/shops/205909/design-uploads
```

The result was a complete design resource:

```json
{
  "id": "deaa2106-b042-4c3d-8ffb-81b6b00debc4",
  "lifecycleState": "FINAL",
  "designId": "168698525",
  "platform": "EU",
  "name": "Screenshot-1553085752",
  "extension": "png",
  "dateCreated": 1553085994334,
  "dateModified": 1553085994334,
  "size": {
    "unit": "px",
    "width":2560.0,
    "height":1440.0
  }
}
```

Replicating this to upload a user design I got:

```json
{
  "id": "d26db5e2-c34a-4b85-9757-d32ccb48aa30",
  "lifecycleState": "FINAL",
  "designId": "158814195",
  "platform": "EU",
  "name": "example",
  "extension": "png",
  "dateCreated": 1553203341608,
  "dateModified": 1553203341608,
  "size": {
    "unit": "px",
    "width": 995.0,
    "height": 610.0
  }
}
```

Next steps
---

* Uploading of userDesigns is working
* I need to test changing the price
* userDesigns are only useful to our case iff we can open them via deeplink to the designer
* shopDesigns might be an alternative route to enable opening via deeplink
  * However I'm not sure we can create them
* We may need to use the idea/flex api
  * This could imply a need for reverse engineering

Continuous testing
---

* The API will be subject to changes not desired by us
* Therefore we shall continuously monitor whether something breaks
* Monitoring should:
  * Run some journeys from time to time and verify expected results
  * Not create trash where avoidable
  * Output curl equivalent to http requests so that
    * Writing an additional client in a different language is easy
    * Replicating a problem is easy