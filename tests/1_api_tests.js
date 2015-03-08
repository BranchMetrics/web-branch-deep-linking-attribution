/*
 * This file defines the unit tests for the api class
 * The actual requests are mocked by stubbing out XHRRequest and jsonpRequest
 */

/**
 * Defines test variables
 */
var maxWaitTime;
var asyncPollingInterval;
var params;
var branchAPI;

/**
 * Setup the api Function
 */
var setUp = function() {

	// Maximum wait time for async tests (ms)
	maxWaitTime = 5000;

	branchAPI = new BranchAPI();

	// How often we should check for the finished state of an async test
	asyncPollingInterval = 100;

	// Standard set of dummy params
	params = {
		app_id: '5680621892404085',
		session_id: '98807509250212101',
		identity_id: '98807509250212101',
		browser_fingerprint_id: '79336952217731267'
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
	var sentRequest = { };
	var recievedFired;

	stubs.replace(branchAPI, 'XHRRequest', function(url, postData, method, storage, callback) {
		callback(expectedError,
			expectedResponse,
			{
				"url": url,
				"postData": postData,
				"method": method
			});
	});

	stubs.replace(branchAPI, 'jsonpRequest', function(url, postData, method, callback) {
		callback(expectedError,
			expectedResponse,
			{
				"url": url,
				"postData": postData,
				"method": method
			});
	});

	waitForCondition(
		function() {
			return recievedFired;
		},
		function() { assertions(receivedData, sentRequest) },
		asyncPollingInterval,
		maxWaitTime
	);

	testFunction(function(err, data, request) {
		recievedFired = true;
		receivedData = err || data;
		sentRequest = request;
	});
};

/**
 * Helper function for API Requests
 */

var runAPITest = function(resource, extraParams, expectedRequest, expectedError, expectedResponse) {
	for (var i = 0; i < extraParams.length; i++) {
		var key = Object.keys(extraParams[i])[0];
		params[key] = extraParams[i][key];
	}

	runAsyncTest(function(callback) {
		var callAPI = function() {
			branchAPI.request(resources[resource],
				params,
				api_storage,
				function(err, data, request) {
					callback(err, utils.whiteListSessionData(data), request);
				});
		};
		if (expectedError) {
			recievedFired = true;
			var err = assertThrows("should return error", callAPI);
			assertEquals("should return expected error message", expectedError.message, err.message);
			callback(err, null);
		}
		else {
			callAPI();
		}

	}, function(receivedData, sentRequest) {
		if (expectedRequest) {
			assertObjectEquals("should send expected request", expectedRequest, sentRequest);
		}
		if (expectedResponse) {
			assertObjectEquals("should return expected response", expectedResponse, receivedData);
		}
	},
	expectedError,
	expectedResponse);
};

// ===========================================================================================
/**
 * Open Tests
 */
var testOpen = function() {
	runAPITest(
		'open',
		[ { "link_identifier":  utils.urlValue('_branch_match_id') }, { "is_referrable": 1 } ],
		{
			"url": "https://api.branch.io/v1/open",
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id + "&is_referrable=1&browser_fingerprint_id=" + params.browser_fingerprint_id,
			"method": "POST"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

var testOpenMissingIsReferrable = function() {
	runAPITest(
		'open',
		[ { "link_identifier":  utils.urlValue('_branch_match_id') } ],
		null,
		Error("API request /v1/open missing parameter is_referrable"),
		null);
}

// ===========================================================================================
/**
 * Profile Tests
 */
var testProfile = function() {
	runAPITest(
		'profile',
		[ { "link_identifier":  utils.urlValue('_branch_match_id') }, { "identity": "test_id" } ],
		{
			"url": "https://api.branch.io/v1/profile",
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id + "&identity=test_id",
			"method": "POST"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

var testProfileMissingIdentity = function() {
	runAPITest(
		'profile',
		[ { "link_identifier":  utils.urlValue('_branch_match_id') } ],
		null,
		new Error("API request /v1/profile missing parameter identity"),
		null);
}

// ===========================================================================================
/**
 * Logout Tests
 */
var testLogout = function() {
	runAPITest(
		'logout',
		[ { "identity": "test_id" } ],
		{
			"url": "https://api.branch.io/v1/logout",
			"postData": "app_id=" + params.app_id + "&session_id=" + params.session_id,
			"method": "POST"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

// ===========================================================================================
/**
 * Referrals Tests
 */
var testReferrals = function() {
	runAPITest(
		'referrals',
		[ { "identity": "test_id" } ],
		{
			"url": "https://api.branch.io/v1/referrals/" + params.identity_id + "?",
			"postData": "",
			"method": "GET"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

// ===========================================================================================
/**
 * Credits Tests
 */
var testCredits = function() {
	runAPITest(
		'credits',
		[ { "identity": "test_id" } ],
		{
			"url": "https://api.branch.io/v1/credits/" + params.identity_id + "?",
			"postData": "",
			"method": "GET"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

// ===========================================================================================
/**
 * _r Tests
 */
var test_r = function() {
	runAPITest(
		'_r',
		[ { "v": config.version } ],
		{
			"url": "https://bnc.lt/_r?app_id=" + params.app_id + "&v=" + config.version,
			"postData": params,
			"method": "GET"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

var test_rMissingV = function() {
	runAPITest(
		'_r',
		[ { "identity": "test_id" } ],
		null,
		new Error("API request /_r missing parameter v"),
		null);
}

// ===========================================================================================
/**
 * Redeem Tests
 */
var testRedeem = function() {
	runAPITest(
		'redeem',
		[ { "identity": "test_id" }, { "amount": 1 }, { "bucket": "testbucket" } ],
		{
			"url": "https://api.branch.io/v1/redeem",
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id + "&amount=1&bucket=testbucket",
			"method": "POST"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

// ===========================================================================================
/**
 * Redeem Tests
 */
var testLink = function() {
	runAPITest(
		'link',
		[ { "identity": "test_id" } ],
		{
			"url": "https://api.branch.io/v1/url",
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id,
			"method": "POST"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

// ===========================================================================================
/**
 * Redeem Tests
 */
var testLinkClick = function() {
	var link = "3hpH54U-58";
	runAPITest(
		'linkClick',
		[ { "identity": "test_id" }, { "link_url": "l/" + link }, { "click": "click" } ],
		 {
			"url": "https://bnc.lt/l/" + link + "?click=click",
			"postData": "",
			"method": "GET"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

// ===========================================================================================
/**
 * Redeem Tests
 */
var testSMSLinkSend = function() {
	var link = "3hpH54U-58";
	var testPhone = "8009999999";
	runAPITest(
		'SMSLinkSend',
		[ { "identity": "test_id" }, { "link_url": "l/" + link }, { "phone": testPhone } ],
		{
			"url": "https://bnc.lt/c/l/" + link,
			"postData": "phone=" + testPhone,
			"method": "POST"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

// ===========================================================================================
/**
 * Redeem Tests
 */
var testEvent = function() {
	var metadata = {
			"url": "testurl",
			"user_agent": "test_agent",
			"language": "test_language"
		};
	var metadataString = "&metadata.url=testurl&metadata.user_agent=test_agent&metadata.language=test_language";
	var eventName = "test";

	runAPITest(
		'event',
		[ { "identity": "test_id" },
			{ "event": eventName },
			{ "metadata": metadata } ],
		 {
			"url": "https://api.branch.io/v1/event",
			"postData": "app_id=" + params.app_id + "&session_id=" + params.session_id + "&event=" + eventName + metadataString,
			"method": "POST"
		},
		null,
		{ data: null, referring_identity: null, identity: null, has_app: null });
}

// ===========================================================================================

/**
 * Start the tests
 */
 /** @type {goog.testing.PropertyReplacer} */
var stubs = new goog.testing.PropertyReplacer();

var api_storage = storage();

 /** @type {goog.testing.ContinuationTestCase} */
var asyncTestCase = new goog.testing.ContinuationTestCase("API test case");

asyncTestCase.autoDiscoverTests();
G_testRunner.initialize(asyncTestCase);
