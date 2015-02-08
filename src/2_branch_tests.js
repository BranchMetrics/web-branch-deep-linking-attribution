/*
 * This file defines the unit tests for the main function
 */

/**
 * Setup the Branch Function
 */
var setUpPage = function() {

	asyncTestCase.autoDiscoverTests();
	G_testRunner.initialize(asyncTestCase);

	// Main Branch object
	branch = new Branch();
	branch.init('5680621892404085', function(err, data) {
	  //document.getElementsByClassName('info')[0].innerHTML = JSON.stringify(data);
	});

	// Test for callbacks
	reachedSMSMissingPhoneFinal = false;

	// Maximum wait time for async tests (ms)
	maxWaitTime = 10000;

	// How often we should check for the finished state of an async test
	asyncPollingInterval = 500;

	//Standard set of dummy params
	params = {
		phone: "5177401526",
		tags: ['tag1', 'tag2'],
		channel: 'sample app',
		feature: 'create link',
		stage: 'created link',
		type: 1,
		data: {  
			mydata: {
				foo: 'bar'
			},
			'$desktop_url': 'http://s3-us-west-1.amazonaws.com/branch-sdk/example.html',
			'$og_title': 'Branch Metrics',
			'$og_description': 'Branch Metrics',
			'$og_image_url': 'http://branch.io/img/logo_icon_white.png'
		}
	};
}

/**
 * SMS Tests
 */
var testMissingPhoneSMSLink = function() {

	var recievedData = {};
	var expectedData = {};
	var recievedFired;
	
	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should require a phone number", recievedData, expectedData);
			reachedSMSMissingPhoneFinal = true;
		},
		asyncPollingInterval,
		maxWaitTime
	);
	
	branch.SMSLink(params, function(data) {
		console.log(data);
		recievedFired = true;
		recievedData = data;
	});
};

/*
 * Defines global test variables
 */
var maxWaitTime;
var asyncPollingInterval;
var params;
var branch;
var asyncTestCase = new goog.testing.ContinuationTestCase("Branch test case");
var reachedSMSMissingPhoneFinal;