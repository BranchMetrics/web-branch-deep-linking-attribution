var request = require('request');

var safari_browsers = [
	{
		browserName: 'safari',
		platform: 'OS X 10.10',
		version: '8.0'
	}
];

var chrome_browsers = [
	{
		browserName: 'chrome',
		platform: 'OS X 10.10',
		version: '44.0'
	},
	// {
	// 	browserName: 'chrome',
	// 	platform: 'Windows 10',
	// 	version: '43.0'
	// },
	// {
	// 	browserName: 'chrome',
	// 	platform: 'Linux',
	// 	version: '42.0'
	// }
];

var firefox_browsers = [
	{
		browserName: 'firefox',
		platform: 'Windows 10',
		version: '40.0'
	},
	// {
	// 	browserName: 'firefox',
	// 	platform: 'OS X 10.10',
	// 	version: '39.0'
	// },
	// {
	// 	browserName: 'firefox',
	// 	platform: 'Linux',
	// 	version: '38.0'
	// }
];

var android_browsers = [
	{
		browserName: 'android',
		deviceName: 'Android Emulator',
		deviceOrientation: 'portrait',
		platform: 'Linux',
		version: '5.1'
	},
	// {
	// 	browserName: 'android',
	// 	deviceName: 'Google Nexus 7 HD Emulator',
	// 	deviceOrientation: 'portrait',
	// 	platform: 'Linux',
	// 	version: '4.4'
	// },
	// {
	// 	browserName: 'android',
	// 	deviceName: 'Google Nexus 7C Emulator',
	// 	deviceOrientation: 'portrait',
	// 	platform: 'Linux',
	// 	version: '4.3'
	// },
	// {
	// 	browserName: 'android',
	// 	deviceName: 'LG Nexus 4 Emulator',
	// 	deviceOrientation: 'portrait',
	// 	platform: 'Linux',
	// 	version: '4.2'
	// },
	// {
	// 	browserName: 'android',
	// 	deviceName: 'HTC One X Emulator',
	// 	deviceOrientation: 'portrait',
	// 	platform: 'Linux',
	// 	version: '4.1'
	// },
	// {
	// 	browserName: 'android',
	// 	deviceName: 'HTC Evo 3D Emulator',
	// 	deviceOrientation: 'portrait',
	// 	platform: 'Linux',
	// 	version: '4.0'
	// }
];

var ie_browsers = [
	{
		browserName: 'internet explorer',
		platform: 'Windows 10',
		version: '11.0'
	},
	// {
	// 	browserName: 'internet explorer',
	// 	platform: 'Windows 8.1',
	// 	version: '11.0'
	// },
	// {
	// 	browserName: 'internet explorer',
	// 	platform: 'Windows 7',
	// 	version: '10.0'
	// }
];

var test_urls = [
	'http://0.0.0.0:9999/test/test.html',
	'http://0.0.0.0:9999/test/integration-test.html'
];

module.exports = function(grunt) {
	grunt.initConfig({
		'saucelabs-mocha': {
			all: {
				options: {
					username: 'branchmetrics',
					urls: test_urls,
					maxRetries: 3,
					testname: 'Web SDK Tests',
					pollInterval: 30000, // check every 30 seconds
					statusCheckAttempts: -1, // try forever
					browsers: [].concat(
						safari_browsers,
						chrome_browsers,
						// firefox_browsers,
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
