# Full Documentation for Web SDK

This documentation outlines the functionality of the Branch Metrics Web SDK, and how to easily incorporate it into a web app.

Live demo: [https://cdn.branch.io/example.html](https://cdn.branch.io/example.html)

## Installation

### Requirements

This SDK requires only native browser Javascript and has been tested in all modern browsers with sessionStorage capability. No 3rd party libraries are needed to make use of the SDK as it is 100% native Javascript.

### Browser Specific Support

| Chrome | Firefox | Safari | IE |
|:--------:|:-------:|:--------:|:--------:|
| &#10004; |&#10004; | &#10004; | 9, 10, 11 |

#### Specific Browser Support Status

[![Sauce Test Status](https://saucelabs.com/browser-matrix/branchmetrics.svg)](https://saucelabs.com/u/branchmetrics)

### Branch Key (formerly App ID)

You will need to create a [Branch Metrics app](http://branch.io) to obtain your Branch Key (you will have the option to toggle between live and test modes).

### Quick Install (Web SDK)

#### Manual installation

_Be sure to replace `BRANCH KEY` with your actual Branch Key found in your [account dashboard](https://dashboard.branch.io/#/settings)._

**[Formerly App ID](CHANGELOG.md)** Note that for the time being, initializing the Web SDK with an App ID will still work, it is strongly recomended you switch to using your live and test API keys.

```html
<script type="text/javascript">

	// INSERT INIT CODE

	branch.init('BRANCH KEY', function(err, data) {
    	// callback to handle err or data
	});
</script>
```

#### Bower or npm installation

If you use Bower or npm, you can run `bower install branch-sdk` or `npm install branch-sdk` respectively to get the SDK.

#### Common.JS and RequireJS compatibility

In addition to working as a standalone library, the Branch SDK works great in CommonJS environments (browserify, webpack) as well as RequireJS environments (RequireJS/AMD). Just `require('branch')` or `define(['branch'], function(branch) { ... });` to get started!

#### Initialization and Event Handling

You should initialize the Branch SDK session once the ‘deviceready’ event fires and each time the ‘resume’ event fires.  See the example code below. You will need your Branch Key from the Branch dashboard.

```js
  branch.init("YOUR BRANCH KEY HERE", function(err, data) {
  	app.initComplete(err, data);
  });
```

The session close will be sent automatically on any ‘pause’ event.

### SDK Method Queue

Initializing the SDK is an asynchronous method with a callback, so it may seem as though you would need to place any method calls that will execute immidiatley inside the `branch.init()` callback. We've made it even easier than that, by building in a queue to the SDK! The only thing that is required is that `branch.init()` is called prior to any other methods. All SDK methods called are gauranteed to : 1. be executed in the order that they were called, and 2. wait to execute until the previous SDK method finishes. Therefore, it is 100% allowable to do something like:

```js
branch.init(...);
branch.banner(...);
```

If `branch.init()` fails, all subsequent branch methods will fail.
