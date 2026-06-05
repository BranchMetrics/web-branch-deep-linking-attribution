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

# Performance Monitoring

`branch.getPerformanceMetrics()` returns sub-millisecond (`performance.now()`) timings for each phase of SDK initialization, so you can see exactly where load time goes. It is read-only, never throws, and sends nothing to Branch.

Call it after `branch.init()` has finished (for example, from the init callback or later):

```js
branch.init('key_live_xxxxxxxxxxxx', function (err, data) {
  console.log(branch.getPerformanceMetrics());
});
```

It returns:

```js
{
  performance_supported: true,        // false when the browser has no Performance API
  timings: {                          // performance.now() timestamps in ms, or null if the phase did not occur
    sdk_script_load_start, sdk_script_load_end, sdk_parse_end,
    _r_request_start, _r_response_received,
    v1_open_request_start, v1_open_response_received,
    v1_pageview_request_start, v1_pageview_response_received,
    banner_render_start, banner_render_end,
    init_callback_fired
  },
  durations: {                        // computed differences in ms, or null if either bound is missing
    sdk_script_download_ms, sdk_parse_ms,
    _r_roundtrip_ms, v1_open_roundtrip_ms, v1_pageview_roundtrip_ms,
    banner_render_ms,
    total_init_ms                     // init_callback_fired - sdk_script_load_start
  }
}
```

A value is `null` when that phase did not happen: `_r_*` is null where `/_r` is skipped (for example Safari 11+), `banner_*` is null when no Journey is shown, and `sdk_script_load_*` is null when the SDK is bundled (npm import) instead of loaded from a `<script>` tag.

`total_init_ms` ends at the `init()` callback (when deep link data is delivered), which completes after `/v1/open`. It does not include `/v1/pageview` or banner render, which run afterwards — use the raw `v1_pageview_response_received` / `banner_render_end` timestamps if you need the time to those later phases.

# Running locally
Download node 18 (if not using nix)

```sh
node startDev.js
# Navigate to http://localhost:3000/dev.html
```