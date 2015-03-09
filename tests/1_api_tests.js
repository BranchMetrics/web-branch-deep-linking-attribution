/*
 * This file defines the unit tests for the BranchAPI class
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
 * Setup the API test page
 */
 var setUpPage = function() {
	// Maximum wait time for async tests (ms)
	maxWaitTime = 5000;

	// How often we should check for the finished state of an async test
	asyncPollingInterval = 100;

	branchAPI = new BranchAPI();
};

/**
 * Setup each API test
 */
var setUp = function() {
	// Standard set of dummy params
	params = {
		app_id: '5680621892404085',
		session_id: '98807509250212101',
		identity_id: '98807509250212101',
		browser_fingerprint_id: '79336952217731267'
	};
};

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
	var receivedError = { };
	var sentRequest = { };
	var recievedFired;

	var requestStub = function(url, postData, method, storage, callback) {
		callback = callback || storage;
		callback({
				"url": url,
				"postData": postData,
				"method": method
			});
	}

	stubs.replace(branchAPI, 'XHRRequest', requestStub);
	stubs.replace(branchAPI, 'jsonpRequest', requestStub);

	waitForCondition(
		function() {
			return recievedFired;
		},
		function() { assertions(receivedError, sentRequest) },
		asyncPollingInterval,
		maxWaitTime
	);

	testFunction(function(err, request) {
		recievedFired = true;
		receivedError = err;
		sentRequest = request;
	});
};

/**
 * Helper function for API Requests
 */
var runAPITest = function(resource, extraParams, expectedRequest, expectedError) {
	params = utils.merge(params, extraParams);

	runAsyncTest(function(callback) {
		var callAPI = function() {
			branchAPI.request(resources[resource],
				params,
				api_storage,
				function(err, request) {
					callback(err, request);
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
	}, function(sentRequest) {
		if (expectedRequest) {
			assertObjectEquals("should send expected request", expectedRequest, sentRequest);
		}
	});
};

// ===========================================================================================
/**
 * Open Tests
 */
var testOpen = function() {
	runAPITest(
		'open',
		{
			"link_identifier":  utils.urlValue('_branch_match_id'),
			"is_referrable": 1
		},
		{
			"url": "https://api.branch.io/v1/open",
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id + "&is_referrable=1&browser_fingerprint_id=" + params.browser_fingerprint_id,
			"method": "POST"
		});
};

var testOpenMissingIsReferrable = function() {
	runAPITest(
		'open',
		{
			"link_identifier":  utils.urlValue('_branch_match_id')
		},
		null,
		Error("API request /v1/open missing parameter is_referrable"));
};

var testOpenMissingAppId = function() {
	delete params["app_id"];
	runAPITest(
		'open',
		{
			"link_identifier":  utils.urlValue('_branch_match_id'),
			"is_referrable": 1
		},
		null,
		Error("API request /v1/open missing parameter app_id"));
};

var testOpenMissingBrowserFingerprintId = function() {
	delete params["browser_fingerprint_id"];
	runAPITest(
		'open',
		{
			"link_identifier":  utils.urlValue('_branch_match_id'),
			"is_referrable": 1
		},
		null,
		Error("API request /v1/open missing parameter browser_fingerprint_id"));
};

// ===========================================================================================
/**
 * Profile Tests
 */
var testProfile = function() {
	runAPITest(
		'profile',
		{
			"link_identifier":  utils.urlValue('_branch_match_id'),
			"identity": "test_id"
		},
		{
			"url": "https://api.branch.io/v1/profile",
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id + "&identity=test_id",
			"method": "POST"
		});
};

var testProfileMissingIdentity = function() {
	runAPITest(
		'profile',
		{
			"link_identifier":  utils.urlValue('_branch_match_id')
		},
		null,
		Error("API request /v1/profile missing parameter identity"));
};

var testProfileMissingAppId = function() {
	delete params["app_id"];
	runAPITest(
		'profile',
		{
			"link_identifier":  utils.urlValue('_branch_match_id')
		},
		null,
		Error("API request /v1/profile missing parameter app_id"));
};

var testProfileMissingIdentityId = function() {
	delete params["identity_id"];
	runAPITest(
		'profile',
		{
			"link_identifier":  utils.urlValue('_branch_match_id')
		},
		null,
		Error("API request /v1/profile missing parameter identity_id"));
};

// ===========================================================================================
/**
 * Logout Tests
 */
var testLogout = function() {
	runAPITest(
		'logout',
		{
			"identity": "test_id"
		},
		{
			"url": "https://api.branch.io/v1/logout",
			"postData": "app_id=" + params.app_id + "&session_id=" + params.session_id,
			"method": "POST"
		});
};

var testLogoutMissingAppId = function() {
	delete params["app_id"];
	runAPITest(
		'logout',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /v1/logout missing parameter app_id"));
};

var testLogoutMissingSessionId = function() {
	delete params["session_id"];
	runAPITest(
		'logout',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /v1/logout missing parameter session_id"));
};

// ===========================================================================================
/**
 * Referrals Tests
 */
var testReferrals = function() {
	runAPITest(
		'referrals',
		{
			"identity": "test_id"
		},
		{
			"url": "https://api.branch.io/v1/referrals/" + params.identity_id + "?",
			"postData": "",
			"method": "GET"
		});
};

var testReferralsMissingIdentityId = function() {
	delete params["identity_id"];
	runAPITest(
		'referrals',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /v1/referrals missing parameter identity_id"));
};

// ===========================================================================================
/**
 * Credits Tests
 */
var testCredits = function() {
	runAPITest(
		'credits',
		{
			"identity": "test_id"
		},
		{
			"url": "https://api.branch.io/v1/credits/" + params.identity_id + "?",
			"postData": "",
			"method": "GET"
		});
};

var testCreditsMissingIdentityId = function() {
	delete params["identity_id"];
	runAPITest(
		'credits',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /v1/credits missing parameter identity_id"));
};

// ===========================================================================================
/**
 * _r Tests
 */
var test_r = function() {
	runAPITest(
		'_r',
		{
			"v": config.version
		},
		{
			"url": "https://bnc.lt/_r?app_id=" + params.app_id + "&v=" + config.version,
			"postData": params,
			"method": "GET"
		});
};

var test_rMissingV = function() {
	runAPITest(
		'_r',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /_r missing parameter v"));
};

var test_rMissingAppId = function() {
	delete params["app_id"];
	runAPITest(
		'_r',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /_r missing parameter app_id"));
};

// ===========================================================================================
/**
 * Redeem Tests
 */
var testRedeem = function() {
	runAPITest(
		'redeem',
		{
			"identity": "test_id",
			"amount": 1,
			"bucket": "testbucket"
		},
		{
			"url": "https://api.branch.io/v1/redeem",
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id + "&amount=1&bucket=testbucket",
			"method": "POST"
		});
};

var testRedeemMissingAppId = function() {
	delete params["app_id"];
	runAPITest(
		'redeem',
		{
			"identity": "test_id",
			"amount": 1,
			"bucket": "testbucket"
		},
		null,
		Error("API request /v1/redeem missing parameter app_id"));
};

var testRedeemMissingIdentityId = function() {
	delete params["identity_id"];
	runAPITest(
		'redeem',
		{
			"identity": "test_id",
			"amount": 1,
			"bucket": "testbucket"
		},
		null,
		Error("API request /v1/redeem missing parameter identity_id"));
};

var testRedeemMissingAmount = function() {
	runAPITest(
		'redeem',
		{
			"identity": "test_id",
			"bucket": "testbucket"
		},
		null,
		Error("API request /v1/redeem missing parameter amount"));
};

var testRedeemMissingBucket = function() {
	runAPITest(
		'redeem',
		{
			"identity": "test_id",
			"amount": 1
		},
		null,
		Error("API request /v1/redeem missing parameter bucket"));
};

// ===========================================================================================
/**
 * Link Tests
 */
var testLink = function() {
	runAPITest(
		'link',
		{
			"identity": "test_id"
		},
		{
			"url": "https://api.branch.io/v1/url",
			"postData": "app_id=" + params.app_id + "&identity_id=" + params.identity_id,
			"method": "POST"
		});
};

var testLinkMissingIdentityId = function() {
	delete params["identity_id"];
	runAPITest(
		'link',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /v1/url missing parameter identity_id"));
};

var testLinkMissingAppId = function() {
	delete params["app_id"];
	runAPITest(
		'link',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /v1/url missing parameter app_id"));
};

// ===========================================================================================
/**
 * Link Click Tests
 */
var testLinkClick = function() {
	var link = "3hpH54U-58";
	runAPITest(
		'linkClick',
		{
			"identity": "test_id",
			"link_url": "l/" + link,
			"click": "click"
		},
		{
			"url": "https://bnc.lt/l/" + link + "?click=click",
			"postData": "",
			"method": "GET"
		});
};

var testLinkClickMissingLinkUrl = function() {
	runAPITest(
		'linkClick',
		{
			"identity": "test_id",
			"click": "click"
		},
		null,
		Error("API request  missing parameter link_url"));
};

var testLinkClickMissingClick = function() {
	var link = "3hpH54U-58";
	runAPITest(
		'linkClick',
		{
			"identity": "test_id",
			"link_url": "l/" + link
		},
		null,
		Error("API request  missing parameter click"));
};

// ===========================================================================================
/**
 * SMS Tests
 */
var testSMSLinkSend = function() {
	var link = "3hpH54U-58";
	var testPhone = "8009999999";
	runAPITest(
		'SMSLinkSend',
		{
			"identity": "test_id",
			"link_url": "l/" + link,
			"phone": testPhone
		},
		{
			"url": "https://bnc.lt/c/l/" + link,
			"postData": "phone=" + testPhone,
			"method": "POST"
		});
};

var testSMSLinkSendMissingLinkUrl = function() {
	var testPhone = "8009999999";
	runAPITest(
		'SMSLinkSend',
		{
			"identity": "test_id",
			"phone": testPhone
		},
		null,
		Error("API request /c missing parameter link_url"));
};

var testSMSLinkSendMissingPhone = function() {
	var link = "3hpH54U-58";
	runAPITest(
		'SMSLinkSend',
		{
			"identity": "test_id",
			"link_url": "l/" + link
		},
		null,
		Error("API request /c missing parameter phone"));
};

// ===========================================================================================
/**
 * Event Tests
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
		{
			"identity": "test_id",
			"event": eventName,
			"metadata": metadata
		},
		{
			"url": "https://api.branch.io/v1/event",
			"postData": "app_id=" + params.app_id + "&session_id=" + params.session_id + "&event=" + eventName + metadataString,
			"method": "POST"
		});
};

var testEventMissingMetadata = function() {
	var eventName = "test";

	runAPITest(
		'event',
		{
			"identity": "test_id",
			"event": eventName
		},
		null,
		Error("API request /v1/event missing parameter metadata"));
};

var testEventMissingEvent = function() {
	var metadata = {
			"url": "testurl",
			"user_agent": "test_agent",
			"language": "test_language"
		};

	runAPITest(
		'event',
		{
			"identity": "test_id",
			"metadata": metadata
		},
		null,
		Error("API request /v1/event missing parameter event"));
};

var testEventMissingAppId = function() {
	delete params["app_id"];
	var metadata = {
			"url": "testurl",
			"user_agent": "test_agent",
			"language": "test_language"
		};
	var eventName = "test";

	runAPITest(
		'event',
		{
			"identity": "test_id",
			"metadata": metadata,
			"event": eventName
		},
		null,
		Error("API request /v1/event missing parameter app_id"));
};

var testEventMissingSessionId = function() {
	delete params["session_id"];
	var metadata = {
			"url": "testurl",
			"user_agent": "test_agent",
			"language": "test_language"
		};
	var eventName = "test";

	runAPITest(
		'event',
		{
			"identity": "test_id",
			"metadata": metadata,
			"event": eventName
		},
		null,
		Error("API request /v1/event missing parameter session_id"));
};

// ===========================================================================================

/**
 * Some example format validation tests
 */
var testOpenWrongAppIdFormat = function() {
	params["app_id"] = 'ahd7393j'; // Oops, we should *not* have letters here

	runAPITest(
		'open',
		{
			"link_identifier":  utils.urlValue('_branch_match_id'),
			"is_referrable": 1
		},
		null,
		Error("API request /v1/open, parameter app_id is not in the proper format"));
};

var testOpenWrongStringFormat = function() {
	runAPITest(
		'open',
		{
			"link_identifier":  45433, // Oops, link_identifier should be a string, not a number
			"is_referrable": 1
		},
		null,
		Error("API request /v1/open, parameter link_identifier is not a string"));
};

var testOpenWrongNumberFormat = function() {
	runAPITest(
		'open',
		{
			"link_identifier":  utils.urlValue('_branch_match_id'),
			"is_referrable": "1"
		}, // Oops, is_referrable should be a number, not a string
		null,
		Error("API request /v1/open, parameter is_referrable is not a number"));
};

var testEventWrongObjectFormat = function() {
	var metadata = "Hello, I'm not an object."; // Oops, metadata should be an object literal, not a string
	var eventName = "test";

	runAPITest(
		'event',
		{
			"identity": "test_id",
			"event": eventName,
			"metadata": metadata
		},
		null,
		Error("API request /v1/event, parameter metadata is not an object"));
};

var testLinkWrongArrayFormat = function() {
	params["tags"] = "Hello, I'm not an array."; // Oops, params.tags should be an array, not a string
	runAPITest(
		'link',
		{
			"identity": "test_id"
		},
		null,
		Error("API request /v1/url, parameter tags is not an array"));
};

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
