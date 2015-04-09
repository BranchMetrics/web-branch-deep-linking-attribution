// Karma configuration
// Generated on Sun Mar 29 2015 15:10:04 GMT-0400 (EDT)

module.exports = function(config) {
	var customLaunchers = {
		// Chrome
		/*
		sl_chrome_d: {
			base: 'SauceLabs',
			browserName: 'chrome',
			version: 'd'
		},
		sl_chrome_b: {
			base: 'SauceLabs',
			browserName: 'chrome',
			version: 'b'
		},
		sl_chrome_41: {
			base: 'SauceLabs',
			browserName: 'chrome',
			version: '41'
		},
		sl_chrome_40: {
			base: 'SauceLabs',
			browserName: 'chrome',
			version: '40'
		},
		sl_chrome_39: {
			base: 'SauceLabs',
			browserName: 'chrome',
			version: '39'
		},
		sl_chrome_38: {
			base: 'SauceLabs',
			browserName: 'chrome',
			version: '38'
		},
		*/

		// Firefox
		/*
		sl_firefox_d: {
			base: 'SauceLabs',
			browserName: 'firefox',
			version: 'd'
		},
		sl_firefox_b: {
			base: 'SauceLabs',
			browserName: 'firefox',
			version: 'b'
		},
		sl_firefox_36: {
			base: 'SauceLabs',
			browserName: 'firefox',
			version: '36'
		},
		sl_firefox_35: {
			base: 'SauceLabs',
			browserName: 'firefox',
			version: '35'
		},
		sl_firefox_34: {
			base: 'SauceLabs',
			browserName: 'firefox',
			version: '34'
		},
		*/

		// iOS
		/*
		sl_ios_safari_8: {
			base: 'SauceLabs',
			browserName: 'iphone',
			platform: 'OS X 10.9',
			version: '8.2'
		},
		sl_ios_safari_7: {
			base: 'SauceLabs',
			browserName: 'iphone',
			platform: 'OS X 10.9',
			version: '7.1'
		},
		sl_ios_safari_6: {
			base: 'SauceLabs',
			browserName: 'iphone',
			platform: 'OS X 10.9',
			version: '6.1'
		},
		sl_ios_safari_5: {
			base: 'SauceLabs',
			browserName: 'iphone',
			platform: 'OS X 10.9',
			version: '5.1'
		},
		sl_ios_safari_4: {
			base: 'SauceLabs',
			browserName: 'iphone',
			platform: 'OS X 10.9',
			version: '4.3'
		},
		*/

		// Android
		/*
		sl_android_50: {
			base: 'SauceLabs',
			browserName: 'android',
			version: '5.0'
		},
		sl_android_44: {
			base: 'SauceLabs',
			browserName: 'android',
			version: '4.4'
		},
		sl_android_43: {
			base: 'SauceLabs',
			browserName: 'android',
			version: '4.3'
		},
		sl_android_42: {
			base: 'SauceLabs',
			browserName: 'android',
			version: '4.2'
		},
		sl_android_41: {
			base: 'SauceLabs',
			browserName: 'android',
			version: '4.1'
		},
		*/
		sl_android_40: {
			base: 'SauceLabs',
			platform: 'Linux',
			browserName: 'android',
			deviceName: 'Android Emulator',
			deviceOrientation: 'portrait',
			version: '4.0'
		},

		// internet exploder
		sl_ie_11: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '11.0'
		},
		sl_ie_10: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '10.0'
		},
		sl_ie_9: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '9.0'
		},
		sl_ie_8: {
			base: 'SauceLabs',
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '8.0'
		}
	};

	config.set({
		// Sauce Labs
		sauceLabs: {
			testName: 'Web SDK Unit Tests',
			username: process.env.SAUCE_USERNAME,
			accessKey: process.env.SAUCE_ACCESS_KEY,
			startConnect: true
		},
		customLaunchers: customLaunchers,
		browsers: Object.keys(customLaunchers),

		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: 'tests',

		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: [ 'mocha' ],

		// list of files / patterns to load in the browser
		files: [
			'../compiler/library/closure-library-master/closure/goog/base.js',
			{ pattern: '../compiler/library/closure-library-master/closure/goog/**/*.js', included: false, served: true },
			'../src/0_config.js',
			'../src/0_queue.js',
			'../src/0_storage.js',
			'../src/0_utils.js',
			'../src/0_banner_utils.js',
			'../src/1_api.js',
			'../src/1_banner_css.js',
			'../src/1_banner_html.js',
			'../src/1_resources.js',
			'../src/2_banner.js',
			'../src/3_branch.js',
			'../src/4_initialization.js',
			'../node_modules/mocha/mocha.js',
			'../node_modules/sinon/pkg/sinon-1.13.0.js',
			'test-utils.js',
			'1_api.js',
			'0_utils.js',
			'0_queue.js',
			'0_storage.js',
			'3_branch.js'
		],

		// list of files to exclude
		exclude: [
			'src/onpage.js',
			'src/extern.js'
		],

		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
		},

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress', 'saucelabs'],

		// web server port
		port: 9876,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: true,

		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true
	});
};
