// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};
var branch = require('build');

Alloy.Globals.status = "Waiting...";

// Test the brnach SDK...
// console.log("Testing SDK module");
// var sdk = require('io.branch.sdk');
// console.log("Test: " + sdk.testProxyCall(true, 1));
// console.log("Test of proxy call done.");
// console.log("Testing getOpenData");
// console.log("Data: " + JSON.stringify(sdk.getOpenData(1)));

var initDone = function(err, data) {
	if (err != null) {
		console.log("Init error: " + JSON.stringify(err));
		Alloy.Globals.status = err.message;
	} else {
		console.log("Init sucessful: " + JSON.stringify(data));
		Alloy.Globals.status = "Ok";
	}
	Ti.App.fireEvent("branch_init");
};

branch.setDebug(true);
var url;
if (Ti.Platform.osname === "android") {
	url = Ti.Android.currentActivity.intent.data;
} else {
	url = Ti.App.getArguments().url;
}
if (url == null) {
	console.log("URL is null");
} else {
	console.log("URL: " + url);
}
branch.init('key_live_hbpBUqBdc1AtDHIzKDWtdfkmDrf03srM',
	{ "isReferrable" : true, "url": url },
	initDone);

Ti.App.addEventListener('resume', function(e) {
	console.log("Resume");
	branch.init('key_live_hbpBUqBdc1AtDHIzKDWtdfkmDrf03srM',
		{ isReferrable : true },
		initDone);
});

Ti.App.addEventListener('pause', function(e) {
	console.log("Pause");
	branch.close(function(err) {
		if (err != null) {
			console.log("Error with close: " + err.message);
		} else {
			console.log("Close complete");
		}
	});
});

console.log("Done alloy.js");
