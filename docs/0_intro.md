# Branch Metrics Web SDK

This README outlines the functionality of the Branch Metrics Web SDK, and how to easily incorporate it into a web app.

Live demo: [https://cdn.branch.io/example.html](https://cdn.branch.io/example.html)

## Overview

The Branch Web SDK provides an easy way to interact with the Branch API on your website or web app. It requires no frameworks, and is only ~7K gzipped.

To use the Web SDK, you'll need to first initialize it with your Branch Key found in your [Branch dashboard](https://dashboard.branch.io/#/settings). You'll also need to register when your users login with `setIdentity`, and when they logout with `logout`.

Once initialized, the Branch Web SDK allows you to create and share links with a banner, over SMS, or your own methods. It also offers event tracking, access to referrals, and management of credits.

## Installation

### Requirements

This SDK requires native browser Javascript and has been tested in all modern browsers with sessionStorage capability. No 3rd party libraries are needed to make use of the SDK as is it 100% native Javascript.

### Browser Specific Support
| Chrome | Firefox | Safari |     IE     |
| ------ | ------- | ------ | ---------- |
|    &#10004;   |    &#10004;    |   &#10004;    |  9, 10, 11 |

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

### Quick Install (Cordova/Phonegap)

This Web SDK can also be used for Cordova/Phonegap applications.  It is provided as a plugin and can be installed with cordova plugin or the plugman tool.  Point the tool at this repositry, https://github.com/BranchMetrics/Web-SDK.git.  For example:

```sh
cordova plugin add https://github.com/BranchMetrics/Web-SDK.git
```

**For a full walktrough specific to integrating the Web SDK with a Cordova app, see the [Cordova Guide](CORDOVA_GUIDE.md).**

Note that this SDK is meant for use with full Cordova/Phonegap apps.  If you are building a hybrid app using an embedded web view and you want to access the Branch API from native code you will want to use the platform specific SDKs and pass data into javascript if needed.

#### Initialization and Event Handling

You should initialize the Branch SDK session once the ‘deviceready’ event fires and each time the ‘resume’ event fires.  See the example code below. You will need your Branch Key from the Branch dashboard.

```js
  branch.init(‘YOUR BRANCH KEY HERE’, function(err, data) {
  	app.initComplete(err, data);
  });
```

The session close will be sent automatically on any ‘pause’ event.

### Quick Install (Titanium)

This Web SDK can also be used for Titanium applications.  There are two pieces which you need for using this SDK in your titanium application.

#### Install the Titanium Modules

The Branch Titanium modules have platform specific native code which is used by the SDK to obtain some device specific information when opening a session.  The modules are located in the dist/titanium folder.  They can be installed by going to Help->Install Mobile Module in the Appcelerator Studio.  Right now there is an iPhone module and an Android module.  Check [here](https://docs.appcelerator.com/platform/latest/#!/guide/Using_a_Module) for more information on installing modules.

The actual SDK javascript code is compiled in the build.js file which is a CommonJS module in the same dist/titanium folder.  Copy this file to your app/lib folder.

You can access the Branch functions by using require to load the CommonJS module.

```js
	var branch = require('build');
	branch.init('YOUR BRANCH KEY HERE', function(err, data) {
		// Do post init work here...
	});
```

See the TITANIUM_GUIDE for more details and the Titanium testbed app for an example.

### SDK Method Queue

Initializing the SDK is an asynchronous method with a callback, so it may seem as though you would need to place any method calls that will execute immidiatley inside the `branch.init()` callback. We've made it even easier than that, by building in a queue to the SDK! The only thing that is required is that `branch.init()` is called prior to any other methods. All SDK methods called are gauranteed to : 1. be executed in the order that they were called, and 2. wait to execute until the previous SDK method finishes. Therefore, it is 100% allowable to do something like:
```js
branch.init(...);
branch.banner(...);
```

If `branch.init()` fails, all subsequent branch methods will fail.

## API Reference

1. Branch Session
  + [.init()](#initapp_id-callback)
  + [.setIdentity()](#setidentityidentity-callback)
  + [.logout()](#logoutcallback)

1. Event Tracking Methods
  + [.track()](#trackevent-metadata-callback)

1. Deeplinking Methods
   + [.link()](#linkmetadata-callback)
   + [.sendSMS()](#sendsmsphone-linkdata-options-callback)

1. Referral Methods
   + [.referrals()](#referralscallback)
   + [.credits()](#creditscallback)
   + [.redeem()](#redeemamount-bucket-callback)

1. Smart Banner
   + [.banner()](#banneroptions-linkdata)

___
