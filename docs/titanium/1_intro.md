# Full Documentation for Titanium SDK

This documentation outlines the functionality of the Branch Metrics Titanium SDK, and how to easily incorporate it into a Titanium app. The Titanium SDK shares the same code base as the Branch Web SDK, and enables you to call all the same functions from your Titanium app.

To use the Titanium SDK, you'll need to first initialize it with your Branch Key found in your [Branch dashboard](https://dashboard.branch.io/#/settings). You'll also need to register when your users login with `setIdentity`, and when they logout with `logout`.

### Register you app

You can sign up for your own Branch Key at [https://dashboard.branch.io](https://dashboard.branch.io)

### Initialize SDK And Register Deep Link Routing Function

The SDK can be initialized by calling `branch.init()`, just as with the Web SDK. A sample app can be found in `testbeds/Titanium`, that demonstrates this.

```js
branch.init('BRANCH KEY', function(err, data) {
	if (err) { console.log("Init error: " + err); }
	else { console.log("Init successful: " + data); }
});
```

### Close the session

Close session must be called whenever the app goes into the background, as it tells the native library that on the next app open, it should check if a new link had been clicked. If you don't call it, you'll notice that the deep link parameters will not be delivered reliably.

```js
branch.close(function(err) {
  if (err) { console.log(err); }
});
```

### Android and iOS differences for init and close

Titanium life cycle events and callbacks differ between Android and iOS.  Since we want to initialize the branch session anytime the app starts up (either on open or when resuming from background) and close the session when the app goes into the background, init and close need to be handled differently for Android and iOS.

Titanium generates a 'pause' and 'resume' event for iOS when the app goes into and returns from the background.  For iOS you can init the session and set event handlers on app startup.  This can be done in alloy.js for an Alloy app.  See the sample code below.

```js

// In the Android case, we get the URL used to open the app here
// but we wait for the Titanium Window, which corresponds to an
// activity, to open to start the session.
if (Ti.Platform.osname === "android") {
	Alloy.Globals.open_url = Ti.Android.currentActivity.intent.data;
}

// If this is not Android, we want to initialize the branch session
// at app startup.  Close it when we go into the background and
// open it again when the app comes back to the foreground.
else if (Ti.Platform.osname.match(/i(os|p(hone|od|ad))/i)) {
	var url = Ti.App.getArguments().url;
	branch.init(BranchKey, { "isReferrable" : true, "url": url }, initDone);

	Ti.App.addEventListener('resume', function(e) {
		console.log("Resume");
		branch.init(BranchKey, { isReferrable : true }, initDone);
	});

	Ti.App.addEventListener('pause', function(e) {
		console.log("Pause");
		branch.close(function(err) {
			if (err) { console.log("Error with close: " + err.message); }
			else { console.log("Close complete"); }
		});
	});
}

```

In Android Titanium gives you access to the onStart and onStop Activity life cycle callbacks which are part of the Android environment.  In the Javascript for each Titanium Window, before the window is opened, you can set a callback for these.  You can init the session in onStart and close it in onStop.  The code below is an example from the testbed app.  Note that the SDK will handle detecting the case where these are called in an activity transition and ensure that the session stays open.

```js

// In Android, we start the branch session in onStart and close it
// in onStop.  This should be done in every Window used in the app
// since a Window corresponds to an Android Activity.  The
// SDK will "smartly" handle the case where we are transitioning from
// one activity to another and not send excess inits or close the session
// accidentally.
if (Ti.Platform.osname === "android") {
	$.index.activity.onStart = function() {
		branch.init('BRANCH KEY',
		{ "isReferrable" : true, "url": Alloy.Globals.open_url },
		function(err, data) {
			if (err != null) {
				console.log("Init error: " + JSON.stringify(err));
				Alloy.Globals.status = err.message;
			} else {
				console.log("Init successful: " + JSON.stringify(data));
				Alloy.Globals.status = "Ok";
			}
			Ti.App.fireEvent("branch_init");
		});
	};

	$.index.activity.onStop = function() {
		branch.close(function(err) {
			if (err) {
				console.log("Error on close: " + err);
			}
		});
	};
}

```

## Building the iOS and Android Branch SDK Modules in Appcelerator Studio

**This tutorial assumes you are already familiar with the Titanium API, and Titanium modules**

The iOS and Android Branch SDK Titanium modules can be built from their respective `src/` directories:
`src/titanium/BranchSDK/iphone`
`src/titanium/BranchSDK/android`

To build the modules in Appcelerator Studio, they must first be imported into your project, or into a new project.

1. Open the App Explorer view on the left (Window -> Show View -> App Explorer), then click "Import Project".
1. Appcelerator Studio will show a variety of import options. Open the "General" folder, and select "Existing Folder as New Project".
1. Select the Branch Titanium SDK folder by clicking "Browse", and choose `src/titanium/BranchSDK/`, then click "Finish".
1. Select the desired module (iOS or Android) in top left of the Appcelerator Studio, above the App Explorer, and click the green play button.
1. Titanium modules can be built to 3 different output locations. The first option (Titanium SDK), publishes the module to your specific Titanium SDK location. Either wise, you can publish the module to an existing Mobile App project, or a specific location. Publishing the module to a specific location will produce a .zip file.

## Installing the iOS and Android Branch SDK Modules

1. Import the testbed app as an existing mobile project: File -> Import, then in the dialog open the "Appcelerator" folder and chose "Existing Mobile Project".
1. The Branch Titanium testbed: `testbeds/titanium/Branch-Sdk-Testbed/`, requires the built Branch SDK modules prior to running. If you would like to add these to the testbed app, simply chose the testbed app or your local Titanium SDK as the output location (see above for building instructions).
1. Browse to the testbed app directory: `testbeds/titanium/Branch-Sdk-Testbed/`, leave the default settings, and chose "Finish".
1. To launch the testbed app simply select the Android or iOS simulator in the top left of Appcelerator studio, above the App Explorer, then click the green play button.

This will build and launch the testbed app in the respective simulator, and log output to the Appcelerator console.

_____

### SDK Method Queue

Initializing the SDK is an asynchronous method with a callback, so it may seem as though you would need to place any method calls that will execute immediately inside the `branch.init()` callback. We've made it even easier than that, by building in a queue to the SDK! The only thing that is required is that `branch.init()` is called prior to any other methods. All SDK methods called are guaranteed to: 1. be executed in the order that they were called, and 2. wait to execute until the previous SDK method finishes. Therefore, it is 100% allowable to do something like:

```js
branch.init(...);
branch.banner(...);
```

If `branch.init()` fails, all subsequent branch methods will fail.

## API Reference

