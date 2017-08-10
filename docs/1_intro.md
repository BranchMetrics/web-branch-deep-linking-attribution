# Branch Web SDK

NOTE: For all users that are on a version earlier than v2.25.0 please update to the latest version. v2.25.0 patches a critical bug in anticipation of iOS 11.

This README outlines the functionality of the Branch Web SDK, and how to easily incorporate it into a web app.

Live demo: [https://cdn.branch.io/example.html](https://cdn.branch.io/example.html)

## Overview

The Branch Web SDK provides an easy way to interact with the Branch API on your website or web app. It requires no frameworks, and is only ~13K gzipped.

To use the Web SDK, you'll need to first initialize it with your Branch Key found in your [Branch dashboard](https://dashboard.branch.io/#/settings). You'll also need to register when your users login with `setIdentity`, and when they logout with `logout`.

Once initialized, the Branch Web SDK allows you to create and share links with a banner, over SMS, or your own methods. It also offers event tracking, access to referrals, and management of credits.

## Using the Sample Web App

We provide a sample web app which demonstrates what Branch Metrics Web SDK can do. The online version can be found at <https://cdn.branch.io/example.html>. Alternatively, you can open `example.html` locally to for the same effect.

To modify this local web app, edit `src/web/example.template.html` first, and then run `make`, which will automatically update `example.html`. Refrain from manually editting `example.html`.

## Installation

### Requirements

This SDK requires native browser Javascript and has been tested in all modern browsers with sessionStorage capability. No 3rd party libraries are needed to make use of the SDK as is it 100% native Javascript.

### Browser Specific Support
| Chrome | Firefox | Safari |     IE     |
| ------ | ------- | ------ | ---------- |
|    &#10004;   |    &#10004;    |   &#10004;    |  9, 10, 11 |

### Quick Install 

#### Recommended Installation

Add the following script within your `<head>` tags:
_Be sure to replace `BRANCH KEY` with your actual Branch Key found in your [account dashboard](https://dashboard.branch.io/#/settings)._

```html
<script type="text/javascript">

	// INSERT INIT CODE

	branch.init('BRANCH KEY', function(err, data) {
    	// callback to handle err or data
	});
</script>
```

You can also get the sdk via npm or bower (branch-sdk)

#### Common.JS and RequireJS compatibility

In addition to working as a standalone library, the Branch SDK works great in CommonJS environments (browserify, webpack) as well as RequireJS environments (RequireJS/AMD). Just `require('branch')` or `define(['branch'], function(branch) { ... });` to get started!

### Initialization

You will need to create a [Branch Metrics app](http://branch.io) to obtain your Branch Key (you will have the option to toggle between live and test modes).

Initializing the SDK is an asynchronous method with a callback, so it may seem as though you would need to place any method calls that will execute immediately inside the `branch.init()` callback. We've made it even easier than that, by building in a queue to the SDK! The only thing that is required is that `branch.init()` is called prior to any other methods. All SDK methods called are guaranteed to : 1. be executed in the order that they were called, and 2. wait to execute until the previous SDK method finishes. Therefore, it is 100% allowable to do something like:
```js
branch.init(...);
branch.banner(...);
```

If `branch.init()` fails, all subsequent branch methods will fail.

___
