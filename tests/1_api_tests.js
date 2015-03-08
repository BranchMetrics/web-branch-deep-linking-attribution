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
	maxWaitTime = 15000;

	branchAPI = new BranchAPI();

	// How often we should check for the finished state of an async test
	asyncPollingInterval = 500;

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
	var recievedFired;

	stubs.replace(branchAPI, 'XHRRequest', function(url, postData, method, storage, callback) {
		callback(expectedError, expectedResponse);
	});

	stubs.replace(branchAPI, 'jsonpRequest', function(url, postData, method, storage, callback) {
		callback(expectedError, expectedResponse);
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

/**
 * Helper function for API Requests
 */

var runAPITest = function(resource, extraParams, expectedRequest, expectedResponse, expectedError, assertText) {
	for (var i = 0; i < extraParams.length; i++) {
		var key = Object.keys(extraParams[i])[0];
		params[key] = extraParams[i][key];
	}

	runAsyncTest(function(callback) {
		branchAPI.request(resources[resource],
			params,
			api_storage,
			function(err, data) {
				callback(err, utils.whiteListSessionData(data));
			});
	}, function(receivedData) {
		assertObjectEquals(assertText, receivedData, expectedResponse);
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
		{ "url": "", "postData": "", "method": "" },
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
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
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id,
			"method": "POST"
		},
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
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
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
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
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
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
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
}

// ===========================================================================================
/**
 * _r Tests
 */
 /*
var test_r = function() {
	runAPITest(
		'_r',
		[ { "identity": "test_id" }, { "v": config.version } ],
		{
			"url": "https://bnc.lt/_r?app_id=" + params.app_id + "&v=" + config.version,
			"postData": params,
			"method": "GET"
		},
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
}
*/
// ===========================================================================================
/**
 * Redeem Tests
 */
var testRedeem = function() {
	runAPITest(
		'redeem',
		[ { "identity": "test_id" }, { "amount": 1 }, { "bucket": "testbucket" } ],
		{},
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
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
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
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
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
}

// ===========================================================================================
/**
 * Redeem Tests
 */
var testSMSLinkSend = function() {
	var link = "3hpH54U-58";
	runAPITest(
		'SMSLinkSend',
		[ { "identity": "test_id" }, { "link_url": "l/" + link }, { "phone": "8009999999" } ],
		{},
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
}

// ===========================================================================================
/**
 * Redeem Tests
 */
var testEvent = function() {
	var metadata = utils.merge({
			"url": document.URL,
			"user_agent": navigator.userAgent,
			"language": navigator.language
		}, { });
	var eventName = "test";
	runAPITest(
		'event',
		[ { "identity": "test_id" },
			{ "event": eventName },
			{ "metadata": metadata } ],
		 {
			"url": "https://api.branch.io/v1/event",
			"postData": "app_id=" + params.app_id + "&session_id=" + params.session_id + "&event=" + eventName + "&metadatas=" + branchAPI.serializeObject(metadata),
			"method": "POST"
		},
		{ data: null, referring_identity: null, identity: null, has_app: null },
		null,
		'should return session data object');
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
