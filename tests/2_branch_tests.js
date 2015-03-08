/*
 * This file defines the unit tests for the Branch class
 */

/**
 * Defines test variables
 */
var maxWaitTime;
var asyncPollingInterval;
var params;
var branch;

/**
 * Setup the Branch Function
 */
var setUp = function() {

	// Main Branch object
	branch = new Branch();
	branch.init('5680621892404085', function(err, data) { });

	// Maximum wait time for async tests (ms)
	maxWaitTime = 15000;

	// How often we should check for the finished state of an async test
	asyncPollingInterval = 500;

	// Standard set of dummy params
	params = {
		tags: [ 'tag1', 'tag2' ],
		channel: 'sample app',
		feature: 'create link',
		stage: 'created link',
		type: 1,
		data: {
			mydata: 'bar',
			'$desktop_url': 'http://s3-us-west-1.amazonaws.com/branch-sdk/example.html',
			'$og_title': 'Branch Metrics',
			'$og_description': 'Branch Metrics',
			'$og_image_url': 'http://branch.io/img/logo_icon_white.png'
		}
	};
}

/**
 * Clean up post tests
 */
var tearDown = function() {
  stubs.reset();
};

/**
 * Helper function for tests
 */
var runAsyncTest = function(testFunction, assertions, expectedError, expectedResponse) {

	var receivedData = { };
	var recievedFired;

	stubs.replace(branch, '_api', function(resource, obj, callback) {
		callback(expectedError, expectedResponse);

		// add queue to this!
	});

	waitForCondition(
		function() {
			return recievedFired;
		},
		function() { assertions(receivedData) },
		asyncPollingInterval,
		maxWaitTime
	);

	testFunction(function(err, data) {
		recievedFired = true;
		receivedData = err || data;
	});
};

// ===========================================================================================
/**
 * SMS Tests
 */

 // SMS sends with phone param
var testSendSMS = function() {
	runAsyncTest(function(callback) {
		branch.sendSMS('5177401526', params, { }, function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertUndefined("should return undefined", receivedData);
	},
	null,
	undefined);
}

// ===========================================================================================
/**
 * Track tests
 */
 // Track event with required params
 var testTrack = function() {
	runAsyncTest(function(callback) {
		branch.track('Tracked this click', function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertUndefined("should return undefined", receivedData);
	},
	null,
	undefined);
}

// ===========================================================================================
/**
 * Show Referrals tests
 */
var testReferrals = function() {
	runAsyncTest(function(callback) {
		branch.referrals(function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertTrue("should return an object", (typeof receivedData && receivedData != null));
	},
	null,
	{ });
}

// ===========================================================================================
/**
 * Show Credits tests
 */
var testCredits = function() {
	runAsyncTest(function(callback) {
		branch.credits(function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertTrue("should return an object", (typeof receivedData && receivedData != null));
	},
	null,
	{ });
}

// ===========================================================================================
/**
 * Identify tests
 */
var testSetIdentity = function() {
	var expectedData = {
		"link": "https://bnc.lt/i/3T0CTu--23",
		"referring_data": "awesome data"
	};

	runAsyncTest(function(callback) {
		branch.setIdentity('Branch', function(err, data) { callback(err, data) });
	}, function(receivedData) {
			assertNonEmptyString("should return correct link", receivedData.link);
			assertNonEmptyString("should return correct referring_data", receivedData.referring_data);
	},
	null,
	expectedData);
}

// ===========================================================================================
/**
 * Redeem Credits tests
 */
var testRedeem = function() {
	var expectedError = new Error('Not enough credits to redeem.');

    var amount = 5;
    var bucket = 'default';

	runAsyncTest(function(callback) {
		branch.redeem(amount, bucket, function(err, data) {
			callback(err, data) });
	}, function(receivedData) {
		assertObjectEquals("should return error for not enough credits", expectedError, receivedData);
	},
	expectedError);
}

// ===========================================================================================
/**
 * App banner tests
 */

// ===========================================================================================
/**
 * Create link tests
 */
var testLink = function() {
	runAsyncTest(function(callback) {
		branch.link(params, function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertNonEmptyString("should create link with required params", receivedData);
		var branchURL = "https://bnc.lt/l/";
		var recievedURLRoot = receivedData.substring(0, 17);
		assertEquals("should return branch URL", branchURL, recievedURLRoot);
	},
	null,
	'https://bnc.lt/l/3ffPbeE-_K');
}

// ===========================================================================================
/**
 * Logout tests
 */
var testLogout = function() {
	runAsyncTest(function(callback) {
		branch.logout(function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertUndefined("should return undefined", receivedData);
	},
	null,
	undefined);
}

// ===========================================================================================

/**
 * Start the tests
 */
 /** @type {goog.testing.PropertyReplacer} */
var stubs = new goog.testing.PropertyReplacer();

 /** @type {goog.testing.ContinuationTestCase} */
var asyncTestCase = new goog.testing.ContinuationTestCase("Branch test case");

asyncTestCase.autoDiscoverTests();
G_testRunner.initialize(asyncTestCase);
