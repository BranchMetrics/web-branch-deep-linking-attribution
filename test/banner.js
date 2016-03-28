'use strict';

goog.require('utils');
goog.require('Branch');
goog.require('resources');
goog.require('config');
goog.require('storage');
goog.require('session');
goog.require('banner');
goog.require('banner_utils');
goog.require('banner_html');
goog.require('banner_css');

goog.require('goog.json'); // jshint unused:false
goog.require('goog.testing');

/*globals branch_sample_key, session_id, identity_id, browser_fingerprint_id, BranchStorage */

describe('Banner', function() {
	// var storage = new BranchStorage([ 'pojo' ]);
	// var sandbox;
	// var requests;

	window.sdk_version = 'web' + config.version;

	beforeEach(function() {
		// testUtils.go('');
		// sandbox = sinon.sandbox.create();
		// localStorage.clear();
		// sessionStorage.clear();
		// requests = [];
	});

	afterEach(function() {
		// sandbox.restore();
	});

	// function initBranch(runInit, keepStorage) {
	// 	if (!keepStorage) {
	// 		storage.clear();
	// 	}
	// 	var branch = new Branch();

	// 	sandbox.stub(branch._server, 'request', function(resource, obj, storage, callback) {
	// 		requests.push({
	// 			resource: resource,
	// 			obj: obj,
	// 			callback: callback
	// 		});
	// 	});

	// 	if (runInit) {
	// 		branch.init(branch_sample_key);
	// 		requests[0].callback(null, browser_fingerprint_id);
	// 		requests[1].callback(
	// 			null,
	// 			{
	// 				browser_fingerprint_id: browser_fingerprint_id,
	// 				identity_id: identity_id,
	// 				session_id: session_id
	// 			}
	// 		);
	// 		requests = [];
	// 	}

	// 	return branch;
	// }

	describe('banner (wrapped)', function() {
		it('has wrapped API method that supplies default options and data', function() {
			// The following can be confusing due to naming issues, but it might
			// help to realize that there are two different methods named
			// 'banner': one is defined in the Branch object in 6_branch.js,
			// while the other is a global function (mocked in this test)
			// defined in 5_banner.js
		
			// Mock context for the Branch object
			var branchContext = {
				_queue: function(next) { next(function() {}); },
				_storage: {},
				init_state: 3 // INIT_SUCCEEDED
			};

			// Mock the global 'banner' function.  Sinon does not appear to
			// be able to do this, so we are using Closure Compiler API calls
			// instead.
			var bannerMock = goog.testing.createGlobalFunctionMock('banner');

			// These are the options and data expected to be passed on to the
			// internal banner call...they are not the same objects as what is 
			// passed into Branch.banner()
			var bannerOptions = {
				icon: '',
				title: '',
				description: '',
				reviewCount: null,
				rating: null,
				openAppButtonText: 'View in app', // TODO: case
				downloadAppButtonText: 'Download App',
				sendLinkText: 'Send Link',
				phonePreviewText: '(999) 999-9999',
				iframe: true,
				showiOS: true,
				showiPad: true,
				showAndroid: true,
				showBlackberry: true,
				showWindowsPhone: true,
				showDesktop: true,
				showKindle: true,
				disableHide: false,
				forgetHide: false,
				position: 'top',
				customCSS: '',
				mobileSticky: false,
				desktopSticky: true,
				theme: 'light',
				buttonBorderColor: '',
				buttonBackgroundColor: '',
				buttonFontColor: '',
				buttonBorderColorHover: '',
				buttonBackgroundColorHover: '',
				buttonFontColorHover: '',
				make_new_link: false,
				open_app: false
			};
			var bannerData = {
				// we don't expect any changes here
			};

			// Record what parameters a particular call expects, and override
			// the functionality to return a key (in place of a function) to 
			// be checked for.
			bannerMock(branchContext,bannerOptions,bannerData,branchContext._storage).$returns('fake callback');

			// The setup is done, run the actual test:
			bannerMock.$replay();
			Branch.prototype.banner.call(branchContext, {}, {});

			// Make sure everything went as expected:
			bannerMock.$verify();

			// And finally, release the mock...
			bannerMock.$tearDown();
		});

		it('has wrapped API method that uses supplied options and data', function() {
			// The following can be confusing due to naming issues, but it might
			// help to realize that there are two different methods named
			// 'banner': one is defined in the Branch object in 6_branch.js,
			// while the other is a global function (mocked in this test)
			// defined in 5_banner.js
		
			// Mock context for the Branch object
			var branchContext = {
				_queue: function(next) { next(function() {}); },
				_storage: {},
				init_state: 3 // INIT_SUCCEEDED
			};

			// Mock the global 'banner' function.  Sinon does not appear to
			// be able to do this, so we are using Closure Compiler API calls
			// instead.
			var bannerMock = goog.testing.createGlobalFunctionMock('banner');

			// These are the options and data expected to be passed on to the
			// internal banner call...they should be similar to the objects
			// passed into Branch.banner()
			var bannerOptions = {
				icon: 'Icon',
				title: 'Title',
				description: 'Description',
				reviewCount: 123,
				rating: 2.5,
				openAppButtonText: 'Open App Text',
				downloadAppButtonText: 'Download App Text',
				sendLinkText: 'Send Link Text',
				phonePreviewText: 'Phone Text',
				iframe: false,
				showiOS: false,
				showiPad: false,
				showAndroid: false,
				showBlackberry: false,
				showWindowsPhone: false,
				showDesktop: false,
				showKindle: false,
				disableHide: true,
				forgetHide: true,
				position: 'bottom',
				customCSS: 'custom css',
				mobileSticky: true,
				desktopSticky: false,
				theme: 'dark',
				buttonBorderColor: 'border color',
				buttonBackgroundColor: 'background color',
				buttonFontColor: 'font color',
				buttonBorderColorHover: 'border color hover',
				buttonBackgroundColorHover: 'background color hover',
				buttonFontColorHover: 'font color hover',
				make_new_link: true,
				open_app: true
			};
			var bannerData = {
				one: 1,
				two: 2,
				three: 'THREE!!!'
			};

			// Record what parameters a particular call expects, and override
			// the functionality to return a key (in place of a function) to 
			// be checked for.
			bannerMock(branchContext,bannerOptions,bannerData,branchContext._storage).$returns('fake callback');

			// The setup is done, run the actual test:
			bannerMock.$replay();

			// The options returned and those sent are not the same...
			var options = goog.object.clone(bannerOptions);
			Branch.prototype.banner.call(branchContext, options, bannerData);

			// Make sure everything went as expected:
			bannerMock.$verify();

			// And finally, release the mock...
			bannerMock.$tearDown();
		});
	});
	describe('banner (inner)', function() {
		it('has inner banner call that makes api calls, displays the banner', function() {
			var branchContext = {
				_publishEvent: goog.testing.FunctionMock('_publishEvent'),
				deepview: goog.testing.FunctionMock('deepview')
			}
			var mockUtilsShouldAppend = goog.testing.createMethodMock(banner_utils, 'shouldAppend');
			var mockUtilsGetBodyStyle = goog.testing.createMethodMock(banner_utils, 'getBodyStyle');
			var mockUtilsRemoveElement = goog.testing.createMethodMock(banner_utils, 'removeElement');
			var mockUtilsAddClass = goog.testing.createMethodMock(banner_utils, 'addClass');
			var mockUtilsRemoveClass = goog.testing.createMethodMock(banner_utils, 'removeClass');
			var mockUtilsAddCSSLengths = goog.testing.createMethodMock(banner_utils, 'addCSSLengths');
			var mockUtilsGetDate = goog.testing.createMethodMock(banner_utils, 'getDate');
			var mockHtmlMarkup = goog.testing.createMethodMock(banner_html, 'markup');
			var mockCssCss = goog.testing.createMethodMock(banner_css, 'css');
			var mockUtilsMobileUserAgent = goog.testing.createMethodMock(utils, 'mobileUserAgent');

			branchContext.deepview({
				channel: 'app banner',
				test1: 'one',
				test2: 'two',
				test3: 'three'
			}, {
				open_app: true,
				append_deeplink_path: true,
				make_new_link: true
			});
			branchContext.deepview.$replay();

			banner(branchContext, {
				open_app: true,
				append_deeplink_path: true,
				make_new_link: true
			}, {
				test1: 'one',
				test2: 'two',
				test3: 'three'				
			}, {});

			branchContext.deepview.$verify();
		});
	});
});

