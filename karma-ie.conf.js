// Karma configuration
// Generated on Sun Mar 29 2015 15:10:04 GMT-0400 (EDT)

module.exports = function(config) {
	var customLaunchers = {
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
		basePath: 'test',

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
