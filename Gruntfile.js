var request = require('request');

module.exports = function(grunt) {
	grunt.initConfig({
		'saucelabs-mocha': {
			all: {
				options: {
					username: 'branchmetrics',
					urls: ['http://127.0.0.1:9999/test/test.html'/*, 'http://127.0.0.1:9999/test/integration-test.html'*/],
					tunnelTimeout: 5,
					throttled: 6,
					maxRetries: 3,
					testname: 'Web SDK Tests',

					browsers: [
						// Safari
						{
							browserName: 'safari',
							platform: 'OS X 10.10',
							version: '8.0'
						},
						{
							browserName: 'safari',
							platform: 'OS X 10.9',
							version: '7.0'
						},

						// Chrome
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

						// Firefox
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

						// iOS
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

						// Android
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

						// internet exploder
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
					]
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
