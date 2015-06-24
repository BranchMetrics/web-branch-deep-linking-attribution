// Branch Titanium SDK
// Sample Titanium app

var branch = require('build'),
	BranchKey = '5680621892404085';

Alloy.Globals.status = "Waiting...";

var initDone = function(err, data) {
	if (err) {
		console.log("Init error: " + JSON.stringify(err));
		Alloy.Globals.status = err.message;
	} else {
		console.log("Init sucessful: " + JSON.stringify(data));
		Alloy.Globals.status = "Ok";
	}
	Ti.App.fireEvent("branch_init");
};

branch.setDebug(true);

if (Ti.Platform.osname === "android") {
	Alloy.Globals.open_url = Ti.Android.currentActivity.intent.data;
}
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
