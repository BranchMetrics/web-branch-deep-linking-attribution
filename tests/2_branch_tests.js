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
var app_id;

/**
 * Setup the Branch test page
 */
var setUpPage = function() {
	// Maximum wait time for async tests (ms)
	maxWaitTime = 5000;

	// How often we should check for the finished state of an async test
	asyncPollingInterval = 100;

	app_id = '5680621892404085';
};

/**
 * Setup each Branch tes
 */
var setUp = function() {
	// Main Branch object
	branch = new Branch();
	branch.init(app_id, function(err, data) { });

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
var runAsyncTest = function(testFunction, assertions) {
	var receivedData = { };
	var recievedFired;

	stubs.replace(branch._branchAPI, 'request', function(resource, obj, storage, callback) {
		callback(obj);
	});

	waitForCondition(
		function() {
			return recievedFired;
		},
		function() { assertions(receivedData) },
		asyncPollingInterval,
		maxWaitTime
	);

	testFunction(function(data) {
		recievedFired = true;
		receivedData = data;
	});
};

// ===========================================================================================
/**
 * SMS Tests
 */
/*
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
*/
// ===========================================================================================
/**
 * Track tests
 */
 // Track event with required params
var testTrack = function() {
	var expectedRequest = {
		"event": "test_event",
		"metadata": utils.merge({
			"url": document.URL,
			"user_agent": navigator.userAgent,
			"language": navigator.language
		}, { }),
		"app_id": app_id,
		"session_id": branch.session_id
	};

	runAsyncTest(function(callback) {
		branch.track(expectedRequest["event"], function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertObjectEquals("should send expected request to API", receivedData, expectedRequest);
	});
};

// ===========================================================================================
/**
 * Show Referrals tests
 */
var testReferrals = function() {
	var expectedRequest = {
		"identity_id": branch.identity_id
	};

	runAsyncTest(function(callback) {
		branch.referrals(function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertObjectEquals("should send expected request to API", receivedData, expectedRequest);
	});
};


// ===========================================================================================
/**
 * Show Credits tests
 */
var testCredits = function() {
	var expectedRequest = {
		"identity_id": branch.identity_id
	};

	runAsyncTest(function(callback) {
		branch.credits(function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertObjectEquals("should send expected request to API", receivedData, expectedRequest);
	});
};

// ===========================================================================================
/**
 * Identify tests
 */
var testSetIdentity = function() {
	var expectedRequest = {
		"identity_id": branch.identity_id,
		"app_id": branch.app_id,
		"identity": "test_id"
	};

	runAsyncTest(function(callback) {
		branch.setIdentity(expectedRequest["identity"], function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertObjectEquals("should send expected request to API", receivedData, expectedRequest);
	});
}

// ===========================================================================================
/**
 * Redeem Credits tests
 */
var testRedeem = function() {
	var expectedRequest = {
		"identity_id": branch.identity_id,
		"app_id": branch.app_id,
		"amount": 5,
		"bucket": "test_bucket"
	};

	runAsyncTest(function(callback) {
		branch.redeem(expectedRequest["amount"], expectedRequest["bucket"], function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertObjectEquals("should send expected request to API", receivedData, expectedRequest);
	});
}

// ===========================================================================================
/**
 * App banner tests
 */

// ===========================================================================================
/**
 * Create link tests
 */
 /*
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
*/

// ===========================================================================================
/**
 * Logout tests
 */
 /*
var testLogout = function() {
	runAsyncTest(function(callback) {
		branch.logout(function(err, data) { callback(err, data) });
	}, function(receivedData) {
		assertUndefined("should return undefined", receivedData);
	},
	null,
	undefined);
}
*/

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
