![Latest NPM Version](https://img.shields.io/npm/v/branch-sdk)
![NPM Downloads](https://img.shields.io/npm/dm/branch-sdk)
![License](https://img.shields.io/npm/l/branch-sdk)
![Build](https://github.com/BranchMetrics/web-branch-deep-linking-attribution/actions/workflows/build-push.yml/badge.svg)

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

## Installation

Add the loader to your page and initialize with your Branch key from the [Branch dashboard](https://dashboard.branch.io). Calls made before the SDK finishes loading are queued and replayed.

```html
<script>
  (function(b,r,a,n,c,h,_,s,d,k){if(!b[n]||!b[n]._q){for(;s<_.length;)c(h,_[s++]);d=r.createElement(a);d.async=1;d.src="https://cdn.branch.io/branch-latest.min.js";k=r.getElementsByTagName(a)[0];k.parentNode.insertBefore(d,k);b[n]=h}})(window,document,"script","branch",function(b,r){b[r]=function(){b._q.push([r,arguments])}},{_q:[],_v:1},"addListener banner closeBanner closeJourney data deepview deepviewCta first init link logout removeListener setBranchViewData setIdentity track trackCommerceEvent logEvent disableTracking getBrowserFingerprintId crossPlatformIds lastAttributedTouchData setAPIResponseCallback qrCode setRequestMetaData setAPIUrl getAPIUrl setDMAParamsForEEA referringLink".split(" "), 0);

  branch.init('key_live_YOUR_KEY', function (err, data) {
    // data contains the session and any deep link data
  });
</script>
```

Or install from npm:

```sh
npm install branch-sdk
```

```js
const branch = require('branch-sdk');

branch.init('key_live_YOUR_KEY', function (err, data) {});
```

See [Basic Integration] for the full setup.

## Running locally
Requires Node 24 (provided by the nix dev shell).

```sh
npm run start:dev   # first run prompts for your Branch key, API endpoint and port (default 3000)
# Navigate to http://localhost:3000/dev.html
```

## Bugs / Help / Support

Report bugs and feature requests in this repo's [issues](https://github.com/BranchMetrics/web-branch-deep-linking-attribution/issues/new/choose). For help with your integration or anything else that isn't a bug, [submit a ticket](https://help.branch.io/using-branch/page/submit-a-ticket) or email [support@branch.io](mailto:support@branch.io). To report a security issue, see [SECURITY.md](SECURITY.md).
