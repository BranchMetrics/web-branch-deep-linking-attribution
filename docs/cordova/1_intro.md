# Full Documentation for Cordova SDK

This documentation outlines the functionality of the Branch Metrics Cordova SDK, and how to easily incorporate it into a Cordova app. The Cordova SDK shares the same code base as the Branch Web SDK, and includes functions to call all of the same API endpoints.

Live demo of the Web SDK: [https://cdn.branch.io/example.html](https://cdn.branch.io/example.html)

To use the Cordova SDK, you'll need to first initialize it with your Branch Key found in your [Branch dashboard](https://dashboard.branch.io/#/settings). You'll also need to register when your users login with `setIdentity`, and when they logout with `logout`.

### Register you app

You can sign up for your own Branch Key at [https://dashboard.branch.io](https://dashboard.branch.io)

### Initialize SDK And Register Deep Link Routing Function

Called when an app first initializes a session, ideally in the app delegate. If you created a custom link with your own custom dictionary data, you probably want to know when the user session init finishes, so you can check that data. Think of this callback as your "deep link router." If your app opens with some data, you want to route the user depending on the data you passed in. Otherwise, send them to a generic install flow.

This deep link routing callback is called 100% of the time on init, with your link params or an empty dictionary if none present.

**[Formerly `getInstance() and initSession()`](CORDOVA_UPGRADE_GUIDE.md)**

### Quick Install of Cordova/Phonegap SDK

This Web SDK can also be used for Cordova/Phonegap applications.  It is provided as a plugin and can be installed with cordova plugin or the plugman tool.  Point the tool at this repositry, https://github.com/BranchMetrics/Web-SDK.git.  For example:

```sh
cordova plugin add https://github.com/BranchMetrics/Web-SDK.git
```

Note that this SDK is meant for use with full Cordova/PhoneGap apps.  If you are building a hybrid app using an embedded web view and you want to access the Branch API from native code you will want to use the platform specific SDKs and pass data into javascript if needed.

#### Initialization and Event Handling

You should initialize the Branch SDK session once the ‘deviceready’ event fires and each time the ‘resume’ event fires.  See the example code below. You will need your Branch Key from the Branch dashboard.

```js
  branch.init("YOUR BRANCH KEY HERE", function(err, data) {
  	app.initComplete(err, data);
  });
```
**[Formerly `getInstance() and initSession()`](CORDOVA_UPGRADE_GUIDE.md)**

Here is the location of the Branch Key that you will need for the `branch.init` call above (_formerly app id, which is now depreciated_):

![app id](resources/app_id.png)

The session close will be sent automatically on any ‘pause’ event.

### SDK Method Queue

Initializing the SDK is an asynchronous method with a callback, so it may seem as though you would need to place any method calls that will execute immidiatley inside the `branch.init()` callback. We've made it even easier than that, by building in a queue to the SDK! The only thing that is required is that `branch.init()` is called prior to any other methods. All SDK methods called are gauranteed to : 1. be executed in the order that they were called, and 2. wait to execute until the previous SDK method finishes. Therefore, it is 100% allowable to do something like:

```js
branch.init(...);
branch.banner(...);
```

If `branch.init()` fails, all subsequent branch methods will fail.

