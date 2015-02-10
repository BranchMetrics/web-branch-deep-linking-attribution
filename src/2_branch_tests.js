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
	var expectedData = new Error(utils.message(utils.messages.missingParam, ['/c', 'phone']));
	var recievedFired;

	stubs.replace(params, 'phone', '');

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should require a phone number", recievedData, expectedData);
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
 * Track tests
 */
 // Track event with required params
 var testTrack = function() {

	var recievedData = {};
	var expectedData = {};
	var recievedFired;

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should return empty object", recievedData, expectedData);
		},
		asyncPollingInterval,
		maxWaitTime
	);

	branch.track('Tracked this click', function(data) {
		recievedFired = true;
		recievedData = data;
	});
};

// ===========================================================================================
/**
 * Show Referrals tests
 */
  var testReferrals = function() {

	var recievedData = {};
	var expectedData = {};
	var recievedFired;

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should return empty object if no referrals on test account", recievedData, expectedData);
		},
		asyncPollingInterval,
		maxWaitTime
	);

	branch.track('Tracked this click', function(data) {
		recievedFired = true;
		recievedData = data;
	});
};

// ===========================================================================================
/**
 * Show Credits tests
 */
   var testShowCredits = function() {

	var recievedData = {};
	var expectedData = {};
	var recievedFired;

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should return empty object if no credits on test account", recievedData, expectedData);
		},
		asyncPollingInterval,
		maxWaitTime
	);

	branch.showCredits(function(data) {
		recievedFired = true;
		recievedData = data;
	});
};

// ===========================================================================================
/**
 * Identify tests
 */
 // Returns identity with required params
var testIdentify = function() {

	var recievedData = {};
	var recievedFired;

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertNonEmptyString("should return correct identity id", recievedData.identity_id);
			assertNonEmptyString("should return correct identity id", recievedData.link_click_id);
			assertNonEmptyString("should return correct identity id", recievedData.link);
			assertNonEmptyString("should return correct identity id", recievedData.referring_data);
		},
		asyncPollingInterval,
		maxWaitTime
	);

	branch.identify('Branch', function(data) {
		recievedFired = true;
		recievedData = data;
	});
};


// ===========================================================================================
/**
 * Redeem Credits tests
 */
 var testRedeemCredits = function() {

	var recievedData = {};
	var expectedData = new Error('Not enough credits to redeem.');
	var recievedFired;

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should return error for not enough credits", expectedData, recievedData);
		},
		asyncPollingInterval,
		maxWaitTime
	);

	var creditParams = {
        amount: 5,
        bucket: 'default',
      };
	branch.redeemCredits(creditParams, function(data) {
		recievedFired = true;
		recievedData = data;
	})
};

// ===========================================================================================
/**
 * App banner tests
 */

// ===========================================================================================
/**
 * Create link tests
 */

// Returns link with required params
var testCreateLink = function() {

	var recievedData = {};
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
		},
		asyncPollingInterval,
		maxWaitTime
	);

	branch.createLink(params, function(data) {
		recievedFired = true;
		recievedData = data;
	});
};
/*
// Fails on missing app id
var testMissingAppIdCreateLink = function() {

	var recievedData = {};
	var expectedData = new Error(utils.message(utils.messages.missingParam, ['/v1/url', 'app_id']));
	var recievedFired;

	stubs.replace(branch, 'app_id', '');
	stubs.replace(params, 'app_id', '');

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			console.log("Recieved: " + recievedData);
			console.log("Expected: " + expectedData);
			assertObjectEquals("should require app id", recievedData, expectedData);
		},
		asyncPollingInterval,
		maxWaitTime
	);
	
	branch.createLink(params, function(err, data) {
		recievedFired = true;
		recievedData = data;
	});
};
*/
// ===========================================================================================
/**
 * Logout tests
 */
 // Logs out with required params
var testLogout = function() {

	var recievedData = {};
	var recievedFired;

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertEquals("should return correct session id", branch.session_id, recievedData.session_id);
			assertEquals("should return correct identity id", branch.identity_id, recievedData.identity_id);
		},
		asyncPollingInterval,
		maxWaitTime
	);

	branch.logout(function(data) {
		recievedFired = true;
		recievedData = data;
	});
};

// ===========================================================================================
/**
 * Close tests
 */
// Closes session with required params
 var testClose = function() {

	var recievedFired;
	var recievedData = {};

	waitForCondition(
		function() {
			return recievedFired;
			 },
		function() {
			assertObjectEquals("should return empty object", {}, recievedData);
		},
		asyncPollingInterval,
		maxWaitTime
	);

	branch.close(function(data) {
		recievedData = data;
		branch.init('5680621892404085', function(err, data) {
			recievedFired = true;
		});
	});
};
