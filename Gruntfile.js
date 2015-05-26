var request = require('request');

module.exports = function(grunt) {
	grunt.initConfig({
		'saucelabs-mocha': {
			all: {
				options: {
					username: 'branchmetrics',
					urls: ['http://127.0.0.1:9999/test/test.html', 'http://127.0.0.1:9999/test/integration-test.html'],
					tunnelTimeout: 5,
					throttled: 3,
					maxRetries: 3,
					testname: 'Web SDK Tests',
					browsers: [{
						browserName: "firefox",
						version: "19",
						platform: "XP"
					}]
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
