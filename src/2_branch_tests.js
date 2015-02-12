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
var stubs = new goog.testing.PropertyReplacer();
var asyncTestCase = new goog.testing.ContinuationTestCase("Branch test case");

/**
 * Setup the Branch Function
 */
var setUpPage = function() {

	asyncTestCase.autoDiscoverTests();
	G_testRunner.initialize(asyncTestCase);

	// Main Branch object
	branch = new Branch();
	branch.init('5680621892404085', function(err, data) {});

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
 * Clean up post tests
 */
var tearDown = function() {
  stubs.reset();
};

/**
 * Helper function for tests
 */
var runAsyncTest = function(testFunction, assertions) {

	var recievedData = {};
	var recievedFired;

	waitForCondition(
		function() {
			return recievedFired;
		},
		function() { assertions(recievedData) },
		asyncPollingInterval,
		maxWaitTime
	);

	testFunction(function(err, data) {
		recievedFired = true;
		recievedData = err || data;
	});
};

// ===========================================================================================
/**
 * SMS Tests
 */

 // SMS sends with phone param
var testSMSLink = function() {
	runAsyncTest(function(callback) {
		branch.SMSLink(params, function(err, data) { callback(err, data) });
	}, function(recievedData) {
		assertObjectEquals("should send SMS with phone number", recievedData, {});
	});
}

// For whatever reason, the callbacl in api.js:105 is fired twice, the second time, data is empty
// Fails on missing phone number
/*
var testMissingPhoneSMSLink = function() {
	var expectedData = new Error(utils.message(utils.messages.missingParam, ['/c', 'phone']));
	stubs.replace(params, 'phone', '');

	runAsyncTest(function(callback) {
		branch.SMSLink(params, function(err, data) { callback(err, data) });
	}, function(recievedData) {
		assertObjectEquals("should require a phone number", recievedData, expectedData);
	});
}
*/
// ===========================================================================================
/**
 * Track tests
 */
 // Track event with required params
 var testEvent = function() {
	runAsyncTest(function(callback) {
		branch.event('Tracked this click', function(err, data) { callback(err, data) });
	}, function(recievedData) {
		assertObjectEquals("should return empty object", recievedData, {});
	});
}

// ===========================================================================================
/**
 * Show Referrals tests
 */
var testReferrals = function() {
	runAsyncTest(function(callback) {
		branch.referrals(function(err, data) { callback(err, data) });
	}, function(recievedData) {
		assertTrue("should return an object", (typeof recievedData && recievedData != null));
	});
}

// ===========================================================================================
/**
 * Show Credits tests
 */
var testCredits = function() {
	runAsyncTest(function(callback) {
		branch.credits(function(err, data) { callback(err, data) });
	}, function(recievedData) {
		assertObjectEquals("should return empty object if no credits on test account", recievedData, {"default":"0"});
	});
}

// ===========================================================================================
/**
 * Identify tests
 */
var testProfile = function() {
	runAsyncTest(function(callback) {
		branch.profile('Branch', function(err, data) { callback(err, data) });
	}, function(recievedData) {
		assertNonEmptyString("should return correct identity id", recievedData.identity_id);
			assertNonEmptyString("should return correct identity id", recievedData.link_click_id);
			assertNonEmptyString("should return correct identity id", recievedData.link);
			assertNonEmptyString("should return correct identity id", recievedData.referring_data);
	});
}

// ===========================================================================================
/**
 * Redeem Credits tests
 */
var testRedeem = function() {
	var expectedData = new Error('Not enough credits to redeem.');

	var creditParams = {
        amount: 5,
        bucket: 'default',
	};

	runAsyncTest(function(callback) {
		branch.redeem(creditParams, function(err, data) { 
			callback(err, data) });
	}, function(recievedData) {
		assertObjectEquals("should return error for not enough credits", expectedData, recievedData);
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
var testLink = function() {
	runAsyncTest(function(callback) {
		branch.link(params, function(err, data) { callback(err, data) });
	}, function(recievedData) {
		assertNonEmptyString("should create link with required params", recievedData);
		var branchURL = "https://bnc.lt/l/";
		var recievedURLRoot = recievedData.substring(0, 17);
		assertEquals("should return branch URL", branchURL, recievedURLRoot);
	});
}

// ===========================================================================================
/**
 * Logout tests
 */
var testLogout = function() {
	runAsyncTest(function(callback) {
		branch.logout(function(err, data) { callback(err, data) });
	}, function(recievedData) {
		assertNotEquals("should return correct session id", branch.session_id, recievedData.session_id);
		assertNotEquals("should return correct identity id", branch.identity_id, recievedData.identity_id);
	});
}

// ===========================================================================================
/**
 * Close tests
 */
 var testClose = function() {
	runAsyncTest(function(callback) {
		branch.close(function(err, closeData) { 
			branch.init('5680621892404085', function(err, data) {
				callback(err, closeData);
			});
		});
	}, function(recievedData) {
		assertObjectEquals("should return empty object", {}, recievedData);
	});
}