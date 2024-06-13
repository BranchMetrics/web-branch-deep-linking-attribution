![Latest NPM Version](https://img.shields.io/npm/v/branch-sdk)
![NPM Downloads](https://img.shields.io/npm/dm/branch-sdk)
![License](https://img.shields.io/npm/l/branch-sdk)
![CircleCI](https://img.shields.io/circleci/build/github/BranchMetrics/web-branch-deep-linking-attribution)

[Web Demo App]: https://help.branch.io/developers-hub/docs/web-sdk-overview#section-web-demo-app
[Basic Integration]: https://help.branch.io/developers-hub/docs/web-basic-integration
[Advanced Features]: https://help.branch.io/developers-hub/docs/web-advanced-features
[Testing]: https://help.branch.io/developers-hub/docs/web-testing
[Troubleshooting]: https://help.branch.io/developers-hub/docs/web-troubleshooting
[Web Full Reference]: https://help.branch.io/developers-hub/docs/web-full-reference

# Branch Web SDK

Branch Metrics Deep Linking/Smart Banner Web SDK. Please see
[the SDK documentation](https://help.branch.io/developers-hub/docs/web-sdk-overview)
for full details.

- [Web Demo App]
- [Basic Integration]
- [Advanced Features]
- [Testing]
- [Troubleshooting]
- [Web Full Reference]


## Testing Locally

For testing locally, there are some steps to follow:

### Install http-server

In order to test web-sdk locally, we use http-server installed globally in our local machine

```
    npm i -g http-server
```

### Follow steps

1- Go to `src/0_config.js`
2- Change the value of `config.api_endpoint` to `https://api.stage.branch.io` (this is the staging API)
3- Login into Dashboard in a staging environment (e.g `https://dashboard-nightlyregression.stage.branch.io`)
4- Go to account settings (e.g `https://dashboard-nightlyregression.stage.branch.io/account-settings/profile`)
5- Copy Branch Key (e.g `key_live_eyduRiL1QMzEG8GtR8BHVdblxCgFaGe1`)
6- In code, go to one of the HTML example files (e.g `event-v2-example.html`)
7- Look for meta tag similar to this: <meta name="branch_key" content="key_live_eyduRiL1QMzEG8GtR8BHVdblxCgFaGe1" />
8- Replace content tag with copied Branch Key (<meta name="branch_key" content="copied-branch-key" />)
9- Run `npm run build`
10- Run http-server locally with the port of your choice (e.g `http-server -p 3000`)
11- Go to `http://127.0.0.1:3000/event-v2-example.html`
12- Have fun!