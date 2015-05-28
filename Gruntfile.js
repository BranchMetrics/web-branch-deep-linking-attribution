var request = require('request');

var safari_browsers = [
		{
			browserName: 'safari',
			platform: 'OS X 10.10',
			version: '8.0'
		},
		{
			browserName: 'safari',
			platform: 'OS X 10.9',
			version: '7.0'
		}
	],

	chrome_browsers = [
		{
			browserName: 'chrome',
			platform: 'OS X 10.10',
			version: '42.0'
		},
		{
			browserName: 'chrome',
			platform: 'OS X 10.10',
			version: '41.0'
		},
		{
			browserName: 'chrome',
			platform: 'OS X 10.10',
			version: '40.0'
		},
		{
			browserName: 'chrome',
			platform: 'OS X 10.10',
			version: '39.0'
		},
		{
			browserName: 'chrome',
			platform: 'OS X 10.10',
			version: '38.0'
		},
		{
			browserName: 'chrome',
			platform: 'OS X 10.10',
			version: '37.0'
		}
	],

	firefox_browsers = [
		{
			browserName: 'firefox',
			platform: 'OS X 10.10',
			version: '37'
		},
		{
			browserName: 'firefox',
			platform: 'OS X 10.10',
			version: '36'
		},
		{
			browserName: 'firefox',
			platform: 'OS X 10.10',
			version: '35'
		},
		{
			browserName: 'firefox',
			platform: 'OS X 10.10',
			version: '34'
		},
		{
			browserName: 'firefox',
			platform: 'OS X 10.10',
			version: '33'
		},
		{
			browserName: 'firefox',
			platform: 'OS X 10.10',
			version: '32'
		}
	],

	ios_browsers = [
		{
			browserName: 'iphone',
			platform: 'OS X 10.10',
			version: '8.2'
		},
		{
			browserName: 'iphone',
			platform: 'OS X 10.10',
			version: '8.1'
		},
		{
			browserName: 'iphone',
			platform: 'OS X 10.10',
			version: '8.0'
		},
		{
			browserName: 'iphone',
			platform: 'OS X 10.10',
			version: '7.1'
		},
		{
			browserName: 'iphone',
			platform: 'OS X 10.10',
			version: '7.0'
		},
		{
			browserName: 'iphone',
			platform: 'OS X 10.10',
			version: '6.1'
		},
		{
			browserName: 'iphone',
			platform: 'OS X 10.10',
			version: '6.0'
		},
		{
			browserName: 'iphone',
			platform: 'OS X 10.10',
			version: '5.1'
		}
	],

	android_browsers = [
		{
			browserName: 'android',
			platform: 'Linux',
			version: '5.1'
		},
		{
			browserName: 'android',
			platform: 'Linux',
			version: '5.0'
		},
		{
			browserName: 'android',
			platform: 'Linux',
			version: '4.4'
		},
		{
			browserName: 'android',
			platform: 'Linux',
			version: '4.3'
		},
		{
			browserName: 'android',
			platform: 'Linux',
			version: '4.2'
		},
		{
			browserName: 'android',
			platform: 'Linux',
			version: '4.1'
		},
		{
			browserName: 'android',
			platform: 'Linux',
			version: '4.0'
		}
	],

	ie_browsers = [
		{
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '11.0'
		},
		{
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '10.0'
		},
		{
			browserName: 'internet explorer',
			platform: 'Windows 7',
			version: '9.0'
		}
	];

module.exports = function(grunt) {
	grunt.initConfig({
		'saucelabs-mocha': {
			all: {
				options: {
					username: 'branchmetrics',
					urls: ['http://127.0.0.1:9999/test/test.html', 'http://127.0.0.1:9999/test/integration-test.html'], // Testing integration with phantom
					tunnelTimeout: 5,
					throttled: 10,
					maxRetries: 3,
					pollInterval: 2000,         // (ms) Note: pollInterval * statusCheckAttempts should = 'max-duration'
					statusCheckAttempts: 180,   // So if you change one of these, adjust 'max-duration' accordingly
					'max-duration': 360,        // (s)
					testname: 'Web SDK Tests',
					browsers: safari_browsers.concat(chrome_browsers,
						firefox_browsers,
						ios_browsers,
						android_browsers,
						ie_browsers)
				}
			}
		},
		connect: {
			server: {
				options: {
					port: 9999,
					base: ''
				}
			}
		}
	});

	// Loading dependencies
	for (var key in grunt.file.readJSON("package.json").devDependencies) {
		if (key !== "grunt" && key.indexOf("grunt") === 0) grunt.loadNpmTasks(key);
	}

	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.registerTask('test', ['connect', 'saucelabs-mocha']);
};
