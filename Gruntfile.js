var request = require('request');

var safari_browsers = [
		{
			browserName: 'safari',
			platform: 'OS X 10.10',
			version: '8.0'
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
		}
	],

	firefox_browsers = [
		{
			browserName: 'firefox',
			platform: 'OS X 10.10',
			version: '40.0'
		},
		{
			browserName: 'firefox',
			platform: 'OS X 10.10',
			version: '39.0'
		}
	],

	ios_browsers = [
		{
			browserName: 'iphone',
			deviceName: 'iPhone Simulator',
			deviceOrientation: 'portrait',
			platform: 'OS X 10.10',
			version: '8.4'
		},
		{
			browserName: 'iphone',
			deviceName: 'iPhone Simulator',
			deviceOrientation: 'portrait',
			platform: 'OS X 10.10',
			version: '8.3'
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
					urls: [
						'http://0.0.0.0:9999/test/test.html',
						'http://0.0.0.0:9999/test/integration-test.html'
					],
					maxRetries: 3,
					testname: 'Web SDK Tests',
					browsers: safari_browsers.concat(chrome_browsers,
						firefox_browsers,
						ios_browsers,
						android_browsers,
						ie_browsers)
				}
			},
			options: {
				force: true
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
		if (key !== "grunt" && key.indexOf("grunt") === 0) {
			grunt.loadNpmTasks(key);
		}
	}

	grunt.loadNpmTasks('grunt-saucelabs');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.registerTask('test', ['connect', 'saucelabs-mocha']);
};
