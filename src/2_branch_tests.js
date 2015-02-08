/*
 * This file defines the unit tests for the main function
 */

/**
 * Defines global test variables
 */
var maxWaitTime;
var asyncPollingInterval;
var params;
var branch;
var stubs;
var asyncTestCase = new goog.testing.ContinuationTestCase("Branch test case");
var asyncReachedFinal;

/**
 * Setup the Branch Function
 */
var setUpPage = function() {

	asyncTestCase.autoDiscoverTests();
	G_testRunner.initialize(asyncTestCase);
	stubs = new goog.testing.PropertyReplacer();

	// Main Branch object
	branch = new Branch();
	branch.init('5680621892404085', function(err, data) {
	  //document.getElementsByClassName('info')[0].innerHTML = JSON.stringify(data);
	});

	// Test for callbacks
	asyncReachedFinal = false;

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

// ===========================================================================================
/**
 * SMS Tests
 */

 // SMS sends with phone param
var testSMSLink = function() {

	var recievedData = {};
	var expectedData = {};
	var recievedFired;
	
	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should send SMS with phone number", recievedData, expectedData);
			asyncReachedFinal = true;
		},
		asyncPollingInterval,
		maxWaitTime
	);
	
	branch.SMSLink(params, function(data) {
		recievedFired = true;
		recievedData = data;
	});
};

// Fails on missing phone number
var testMissingPhoneSMSLink = function() {

	var recievedData = {};
	var expectedData = new Error(utils.message(utils.messages.missingParam, 'phone'));
	var recievedFired;

	stubs.replace(params, 'phone', '');
	
	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should require a phone number", recievedData, expectedData);
			asyncReachedFinal = true;
		},
		asyncPollingInterval,
		maxWaitTime
	);
	
	branch.SMSLink(params, function(data) {
		recievedFired = true;
		recievedData = data;
	});
};

// ===========================================================================================
/**
 * Create link tests
 */

// Returns link with required params
var testCreateLink = function() {

	var recievedData = {};
	var expectedData = {};
	var recievedFired;

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertNonEmptyString("should create link with required params", recievedData);
			var branchURL = "https://bnc.lt/l/";
			var recievedURLRoot = recievedData.substring(0, 17);
			assertEquals("should return branch URL", branchURL, recievedURLRoot);
			asyncReachedFinal = true;
		},
		asyncPollingInterval,
		maxWaitTime
	);

	branch.createLink(params, function(err, data) {
		recievedFired = true;
		recievedData = data;
	});
};

 // ===========================================================================================
/**
 * Clean up post tests
 */
var tearDown = function() {
  stubs.reset();
};