# Full Documentation for Titanium SDK

This documentation outlines the functionality of the Branch Metrics Titanium SDK, and how to easily incorporate it into a Titanium app. The Titanium SDK shares the same code base as the Branch Web SDK, and enables you to call all the same functions from your Titanum app.

To use the Titanium SDK, you'll need to first initialize it with your Branch Key found in your [Branch dashboard](https://dashboard.branch.io/#/settings). You'll also need to register when your users login with `setIdentity`, and when they logout with `logout`.

### Register you app

You can sign up for your own Branch Key at [https://dashboard.branch.io](https://dashboard.branch.io)

### Initialize SDK And Register Deep Link Routing Function

Called when an app first initializes a session, ideally in the app delegate. If you created a custom link with your own custom dictionary data, you probably want to know when the user session init finishes, so you can check that data. Think of this callback as your "deep link router." If your app opens with some data, you want to route the user depending on the data you passed in. Otherwise, send them to a generic install flow.

This deep link routing callback is called 100% of the time on init, with your link params or an empty dictionary if none present.


```js
branch.init('BRANCH KEY', function(err, data) {
	if (err) { console.log("Init error: " + err); }
	else { console.log("Init sucessful: " + data); }
});
```

### Close the session

Close sesion must be called whenever the app goes into the background, as it tells the native library that on the next app open, it should check if a new link had been clicked. If you don't call it, you'll notice that the deep link parameters will not be delivered reliably.

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

In Android Titanium gives you access to the onStart and onStop Activity life cycle callbacks which are part of the Android environment.  In the javascript code for each Titanium Window, before the window is opened, you can set a callback for these.  You can init the session in onStart and close it in onStop.  The code below is an example from the testbed app.  Note that the SDK will handle detecting the case where these are called in an activity transition and ensure that the session stays open.

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
				console.log("Init sucessful: " + JSON.stringify(data));
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

_____


#### Register an activity for direct deep linking (optional but recommended)

In your project's manifest file, you can register your app to respond to direct deep links (yourapp:// in a mobile browser) by adding the second intent filter block. Also, make sure to change **yourapp** to a unique string that represents your app name.

Secondly, make sure that this activity is launched as a singleTask. This is important to handle proper deep linking from other apps like Facebook.

Typically, you would register some sort of splash activitiy that handles routing for your app.

```xml
<activity
	android:name="com.yourapp.SplashActivity"
	android:label="@string/app_name"
	<!-- Make sure the activity is launched as "singleTask" -->
	android:launchMode="singleTask"
	 >
	<intent-filter>
		<action android:name="android.intent.action.MAIN" />
		<category android:name="android.intent.category.LAUNCHER" />
	</intent-filter>

	<!-- Add this intent filter below, and change yourapp to your app name -->
	<intent-filter>
		<data android:scheme="yourapp" android:host="open" />
		<action android:name="android.intent.action.VIEW" />
		<category android:name="android.intent.category.DEFAULT" />
		<category android:name="android.intent.category.BROWSABLE" />
	</intent-filter>
</activity>
```
_____

### iOS plist

#### Add your Branch Key to your project

After you register your app, your Branch Key can be retrieved on the [Settings](https://dashboard.branch.io/#/settings) page of the dashboard. Now you need to add it to YourProject-Info.plist (Info.plist for Swift).

1. In plist file, mouse hover "Information Property List" which is the root item under the Key column.
1. After about half a second, you will see a "+" sign appear. Click it.
1. In the newly added row, fill in "branch_key" for its key, leave type as String, and enter your app's Branch Key obtained in above steps in the value column.
1. Save the plist file.

#### Register a URI scheme direct deep linking (optional but recommended)

You can register your app to respond to direct deep links (yourapp:// in a mobile browser) by adding a URI scheme in the YourProject-Info.plist file. Make sure to change **yourapp** to a unique string that represents your app name.

1. In Xcode, click on YourProject-Info.plist on the left.
1. Find URL Types and click the right arrow. (If it doesn't exist, right click anywhere and choose Add Row. Scroll down and choose URL Types)
1. Add "yourapp", where yourapp is a unique string for your app, as an item in URL Schemes as below:

![URL Scheme Demo](https://s3-us-west-1.amazonaws.com/branchhost/urlScheme.png)

Alternatively, you can add the URI scheme in your project's Info page.

1. In Xcode, click your project in the Navigator (on the left side).
1. Select the "Info" tab.
1. Expand the "URL Types" section at the bottom.
1. Click the "+" sign to add a new URI Scheme, as below:

![URL Scheme Demo](https://s3-us-west-1.amazonaws.com/branchhost/urlType.png)

_____

### SDK Method Queue

Initializing the SDK is an asynchronous method with a callback, so it may seem as though you would need to place any method calls that will execute immediately inside the `branch.init()` callback. We've made it even easier than that, by building in a queue to the SDK! The only thing that is required is that `branch.init()` is called prior to any other methods. All SDK methods called are guaranteed to: 1. be executed in the order that they were called, and 2. wait to execute until the previous SDK method finishes. Therefore, it is 100% allowable to do something like:

```js
branch.init(...);
branch.banner(...);
```

If `branch.init()` fails, all subsequent branch methods will fail.

## API Reference

